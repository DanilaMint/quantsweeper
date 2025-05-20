use js_sys::{Array, Object, Reflect};
use wasm_bindgen::prelude::*;

use crate::{
    collapser::Collapser, 
    field::Field, 
    generator::Generator, 
    misc::MiscMethods, 
    opener::TileOpener, 
    tile::{Prob, TileStatus}
};

// ERRORS
const UNDEFINED_FIELD : &'static str =  "Field isn't defined";
const UNDEFINED_CONFIG : &'static str = "Config isn't defined";

#[wasm_bindgen]
#[derive(Clone, Copy, PartialEq)]
pub enum ToolType {
    Shovel,
    SimpleFlag,
    QuantFlag
}

struct GameConfig {
    width : u32,
    height : u32,
    groups : f64,
    candidates : f64
}


#[wasm_bindgen]
struct GameEngine {
    current_field : Option<Field>,
    flag_count : usize,
    first_click : bool,
    config : Option<GameConfig>,
    is_game_over : bool,
    current_tool : ToolType,

    field_changes : Vec<(i32, i32)> // оптимизация
}

#[wasm_bindgen]
#[allow(dead_code)]
impl GameEngine {
    #[wasm_bindgen(constructor)]
    pub fn new() -> GameEngine {
        return GameEngine {
            current_field: None,
            config: None,
            flag_count: 0,
            first_click: true,
            is_game_over: false,
            current_tool: ToolType::Shovel,
            field_changes : Vec::new()
        };
    }
    
    // Геттеры
    #[wasm_bindgen(getter, js_name = "isGameOver")]
    pub fn is_game_over(&self) -> bool {
        return self.is_game_over;
    }

    #[wasm_bindgen(getter, js_name = "getQuantFlagCount")]
    pub fn quant_flags(&self) -> usize {
        return self.flag_count;
    }

    #[wasm_bindgen(getter, js_name = "getCurrentTool")]
    pub fn current_tool(&self) -> ToolType {
        return self.current_tool;
    }

    #[wasm_bindgen(getter, js_name = "hasFieldNow")]
    pub fn has_field_now(&self) -> bool {
        return self.current_field.is_some();
    }

    #[wasm_bindgen(getter, js_name = "fieldWidth")]
    pub fn width(&self) -> Result<u32, JsValue> {
        return Ok(self.current_field.as_ref().ok_or(JsValue::from_str(UNDEFINED_FIELD))?.width);
    }

    #[wasm_bindgen(getter, js_name = "fieldHeight")]
    pub fn height(&self) -> Result<u32, JsValue> {
        return Ok(self.current_field.as_ref().ok_or(JsValue::from_str(UNDEFINED_FIELD))?.height);
    }

    #[wasm_bindgen(getter, js_name = "fieldChanges")]
    pub fn field_changes(&self) -> Array {
        return Array::from_iter(self.field_changes.iter().map(|(x, y)| {
            let obj = Object::new();
            Reflect::set(&obj, &"x".into(), &JsValue::from(*x)).unwrap();
            Reflect::set(&obj, &"y".into(), &JsValue::from(*y)).unwrap();
            return obj;
        }));
    }

    // геттеры клеток
    #[wasm_bindgen(js_name = "isTileMine")]
    pub fn is_tile_mine(&self, x : i32, y : i32) -> Result<bool, JsValue> {
        let field = self.current_field.as_ref().ok_or(UNDEFINED_FIELD)?;
        let tile = field.get_tile(x, y).ok_or(format!("Tile ({}, {}) unfound", x, y))?;
        return Ok(tile.prob == Prob(12));
    }

    #[wasm_bindgen(js_name = "getTileStatus")]
    pub fn get_tile_status(&self, x : i32, y : i32) -> Result<TileStatus, JsValue> {
        let field = self.current_field.as_ref().ok_or(UNDEFINED_FIELD)?;
        let tile = field.get_tile(x, y).ok_or(format!("Tile ({}, {}) unfound", x, y))?;
        return Ok(tile.status.clone());
    }

    #[wasm_bindgen(js_name = "getProbabilityAroundTile")]
    pub fn get_prob_around(&self, x : i32, y : i32) -> Result<u8, JsValue> {
        let field = self.current_field.as_ref().ok_or(UNDEFINED_FIELD)?;
        let prob = field.around_prob_sum(x, y)?;
        return Ok(prob.0);
    }

    // экспортируемые методы для привязки
    #[wasm_bindgen(js_name = "startNewGame")]
    pub fn start_new_game(&mut self, width : u32, height : u32, groups : f64, candidates : f64) -> Result<(), JsValue> {
        self.set_config(width, height, groups, candidates);
        self.initialize_field()?;
        self.flag_count = self.calculate_flag_count()?;
        self.first_click = true;
        self.is_game_over = false;
        self.field_changes = (0..width*height).map(|i| ((i % width) as i32, (i / width) as i32)).collect();
        return Ok(());
    }

    #[wasm_bindgen(js_name = "handleTileInteraction")]
    pub fn tile_interact(&mut self, x : i32, y : i32) -> Result<(), JsValue> {
        if self.is_game_over { return Ok(()); }
        match self.current_tool {
            ToolType::Shovel => self.open_tile(x, y),
            _ => self.toggle_flag(x, y)
        }.map_err(|e| JsValue::from(e))?;
        self.check_win()?;
        return Ok(());
    }

    #[wasm_bindgen(js_name = "collapseQuantFlags")]
    pub fn collapse_quant_flags(&mut self) -> Result<(), JsValue> {
        let field = self.current_field.as_mut().ok_or(UNDEFINED_FIELD)?;
        self.field_changes.clear();
        self.field_changes.extend(field.collapse_quant_flags()?);
        return Ok(());
    }

    #[wasm_bindgen(js_name = "changeTool")]
    pub fn change_tool(&mut self, tool : ToolType) {
        self.current_tool = tool;
    }

    // внутренние методы
    fn open_tile(&mut self, x : i32, y : i32) -> Result<(), String> {
        let config = self.config.as_ref().ok_or(UNDEFINED_CONFIG)?;
        let field = self.current_field.as_mut().ok_or(UNDEFINED_FIELD)?;
        self.field_changes.clear();
        self.field_changes.push((x, y));

        if self.first_click {
            field.generate(x, y, config.groups, config.candidates)?;
            self.first_click = false;
        }

        if !field.open_tile(x, y)? {
            self.field_changes.extend(field.multiopen(x, y)?);
        } else {
            self.is_game_over = true;
        }

        return Ok(());
    }

    fn toggle_flag(&mut self, x : i32, y : i32) -> Result<(), String> {
        self.field_changes.clear();
        if self.first_click {return Ok(());}
        let field = self.current_field.as_mut().ok_or(UNDEFINED_FIELD)?;
        match field.get_tile(x, y).ok_or(format!("Unfound tile ({}, {})", x, y))?.status {
            TileStatus::Opened => { return Ok(()); },
            TileStatus::Flag => {
                field.set_tile_status(x, y, TileStatus::None);
            },
            TileStatus::QuantFlag => {
                field.set_tile_status(x, y, TileStatus::None);
                self.flag_count += 1;
            },
            TileStatus::None => {
                if self.current_tool == ToolType::QuantFlag {
                    if self.flag_count > 0 {
                        self.flag_count -= 1;
                        field.set_tile_status(x, y, TileStatus::QuantFlag);
                    }
                }
                else {
                    field.set_tile_status(x, y, TileStatus::Flag);
                }
            },
        }
        self.field_changes.push((x, y));
        return Ok(());
    }

    fn set_config(&mut self, width : u32, height : u32, groups : f64, candidates : f64) {
        self.config = Some(GameConfig {width, height, groups, candidates})
    }

    fn initialize_field(&mut self) -> Result<(), &'static str> {
        let config = self.config.as_ref().ok_or("Config isnt defined")?;
        self.current_field = Some(Field::new(
            config.width, 
            config.height
        ));
        return Ok(());
    }

    fn calculate_flag_count(&self) -> Result<usize, &'static str> {
        let config = self.config.as_ref().ok_or("Config isnt defined")?;
        return Ok( (config.width as f64 * config.height as f64 * config.groups * 1.3) as usize );
    }

    fn check_win(&mut self) -> Result<(), &'static str> {
        if self.current_field.as_ref().ok_or(UNDEFINED_FIELD)?.is_win() {
            self.is_game_over = true;
        }
        return Ok(());
    }
}