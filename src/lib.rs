mod field;
mod tile;

mod bytes;
mod collapser;
mod generator;
mod misc;
mod opener;

use wasm_bindgen::prelude::*;

use field::InternalField;
use tile::TileStatus;

use {bytes::Byter, collapser::Collapser, generator::Generator, misc::MiscMethods, opener::TileOpener};


#[wasm_bindgen]
pub struct ExternalField {
    inner: InternalField,
}

#[wasm_bindgen]
impl ExternalField {
    #[wasm_bindgen(constructor)]
    pub fn new(width: u32, height: u32) -> ExternalField {
        return ExternalField {
            inner: InternalField::new(width, height),
        };
    }

    // геттеры
    #[wasm_bindgen(getter)]
    pub fn width(&self) -> u32 {
        return self.inner.width;
    }

    #[wasm_bindgen(getter)]
    pub fn height(&self) -> u32 {
        return self.inner.height;
    }

    // геттеры клеток
    #[wasm_bindgen(js_name = "hasTileMeasured")]
    pub fn has_tile_measured(&self, x : i32, y : i32) -> Option<bool> {
        return Some(self.inner.get_tile(x, y)?.measured);
    }

    #[wasm_bindgen(js_name = "getTileGroup")]
    pub fn get_tile_group(&self, x : i32, y : i32) -> Option<i8> {
        return Some(self.inner.get_tile(x, y)?.group_id);
    }

    #[wasm_bindgen(js_name = "getTileProb")]
    pub fn get_prob(&self, x : i32, y : i32) -> Option<u8> {
        return Some(self.inner.get_tile(x, y)?.prob.0);
    }

    #[wasm_bindgen(js_name = "getProbabilityAround")]
    pub fn get_around_prob(&self, x: i32, y : i32) -> u8 {
        return self.inner.around_prob_sum(x, y).0;
    }

    #[wasm_bindgen(js_name = "getTileStatus")]
    pub fn get_tile_status(&self, x : i32, y : i32) -> Option<TileStatus> {
        return Some(self.inner.get_tile(x, y)?.status.clone());
    }

    #[wasm_bindgen( js_name = "fromBytes" )]
    pub fn from_bytes(bytes : Vec<u8>) -> Option<ExternalField> {
        if let Ok(result) = InternalField::from_bytes(&bytes) {
            return Some(ExternalField {inner: result});
        }
        return None;
    }

    #[wasm_bindgen]
    pub fn generate(&mut self, first_click_x: i32, first_click_y: i32, groups: f64, candidates: f64) -> Result<(), JsValue> {
        match self.inner.generate(first_click_x, first_click_y, groups, candidates) {
            Ok(_) => Ok(()),
            Err(e) => Err(JsValue::from_str(&e)),
        }
    }

    #[wasm_bindgen]
    pub fn measure(&mut self, x: i32, y: i32) -> Result<(), JsValue> {
        return self.inner.measure(x, y)
            .map_err(|e| JsValue::from(e));
    }

    #[wasm_bindgen( js_name = "measureQuantFlags" )]
    pub fn measure_quant_flags(&mut self) -> Result<(), JsValue> {
        return self.inner.measure_quant_flags()
            .map_err(|e| JsValue::from(e));
    }

    #[wasm_bindgen( js_name = "openTile" )]
    pub fn open_tile(&mut self, x: i32, y: i32) -> Result<bool, JsValue> {
        return self.inner.open_tile(x, y)
            .map_err(|e| JsValue::from(e));
    }

    #[wasm_bindgen( js_name="multiOpenTiles" )]
    pub fn multiopen_wasm(&mut self, x: i32, y: i32) -> Result<js_sys::Array, JsValue> {
        let response = self.inner.multiopen(x, y)
            .map_err(|e| JsValue::from(e))?;
        
        let result = js_sys::Array::new();

        for item in response {
            result.push(&JsValue::from(format!("{{\"x\": {}, \"y\": {} }}", item.0, item.1)));
        }
        return Ok(result);
    }

    #[wasm_bindgen( js_name = "setTileStatus" )]
    pub fn set_tile_status(&mut self, x : i32, y : i32, status : TileStatus) {
        self.inner.set_tile_status(x, y, status);
    }

    #[wasm_bindgen( js_name = "toBytes" )]
    pub fn to_bytes(&self) -> Vec<u8> {
        return self.inner.to_bytes();
    }

    #[wasm_bindgen(js_name = "getEntangledGroup")]
    pub fn get_entangled_group_js(&self, group_id: i8) -> JsValue {
        let arr = js_sys::Array::new();
        for (x, y) in self.inner.get_group_elements(group_id) {
            let obj = js_sys::Object::new();
            js_sys::Reflect::set(&obj, &"x".into(), &x.into()).unwrap();
            js_sys::Reflect::set(&obj, &"y".into(), &y.into()).unwrap();
            arr.push(&obj);
        }
        return arr.into();
    }
}

