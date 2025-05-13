use std::collections::HashSet;
use rand::seq::SliceRandom;

use crate::field::InternalField;
use crate::misc::MiscMethods;
use crate::tile::{Prob, TileStatus};

pub trait Collapser {
    fn measure_simple_tile(&mut self, x: i32, y: i32);
    fn measure_group(&mut self, group_id : i8);
    fn measure(&mut self, x: i32, y: i32) -> Result<(), &str>;
    fn get_tiles_with_quant_flags(&self) -> HashSet<i8>;
    fn measure_quant_flag_groups(&mut self, quantum_groups : &HashSet<i8>);
    fn measure_quant_flags(&mut self);
}

impl Collapser for InternalField {
    fn measure_simple_tile(&mut self, x: i32, y: i32) {
        if let Some(tile) = self.get_mut_tile(x, y) {
            tile.measured = true;
            tile.prob = Prob(0);
        }
    }

    fn measure_group(&mut self, group_id : i8) {
        let group_coords = self.get_group_elements(group_id);
        if let Some(&mine_pos) = group_coords.choose(&mut self.rng) {
            for (cx, cy) in group_coords {
                if let Some(tile) = self.get_mut_tile(cx, cy) {
                    tile.measured = true;
                    tile.prob = if (cx, cy) == mine_pos { Prob(12) } else { Prob(0) };
                }
            }
        }
    }

    fn measure(&mut self, x: i32, y: i32) -> Result<(), &str> {
        if let Some(tile) = self.get_mut_tile(x, y) {
            if tile.measured {
                return Err("Tile has been already measured.");
            }

            let group_id = tile.group_id;

            if group_id == -1 {
                self.measure_simple_tile(x, y);
                return Ok(());
            } else {
                self.measure_group(group_id);
                return Ok(());
            }
        } else {
            return Err("Tile isn't found");
        }
    }

    fn get_tiles_with_quant_flags(&self) -> HashSet<i8> {
        let mut quantum_groups = std::collections::HashSet::new();
        
        for y in 0..self.height {
            for x in 0..self.width {
                if let Some(tile) = self.get_tile(x as i32, y as i32) {
                    if tile.status == TileStatus::QuantFlag {
                        quantum_groups.insert(tile.group_id);
                    }
                }
            }
        }
        return quantum_groups;
    }

    fn measure_quant_flag_groups(&mut self, quantum_groups : &HashSet<i8>) {
        for &group_id in quantum_groups {
            if group_id == -1 {
                for y in 0..self.height as i32 {
                    for x in 0..self.width as i32 {
                        if let Some(tile) = self.get_mut_tile(x, y) {
                            if tile.status == TileStatus::QuantFlag && tile.group_id == -1 {
                                tile.measured = true;
                                tile.status = TileStatus::None;
                            }
                        }
                    }
                }
            } else {
                // Группы запутанных тайлов
                self.measure_group(group_id);
                
                // Убираем флажки у всей группы
                let group_coords = self.get_group_elements(group_id);
                for (x, y) in group_coords {
                    if let Some(tile) = self.get_mut_tile(x, y) {
                        tile.status = TileStatus::None;
                    }
                }
            }
        }
    }

    fn measure_quant_flags(&mut self) {
        let quantum_groups = self.get_tiles_with_quant_flags();
        self.measure_quant_flag_groups(&quantum_groups);
    }
}