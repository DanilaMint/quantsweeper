use std::collections::HashSet;
use fastrand;

use crate::field::{Field, DIRECTIONS};
use crate::misc::MiscMethods;
use crate::tile::*;

pub trait Collapser {
    fn collapse_simple_tile(&mut self, x: i32, y: i32) -> Result<(), String>;
    fn collapse_group(&mut self, group_id : i16) -> Result<(), String>;
    fn collapse(&mut self, x: i32, y: i32) -> Result<(), String>;
    fn get_tiles_with_quant_flags(&self) -> HashSet<i16>;
    fn collapse_quant_flag_groups(&mut self, quantum_groups : &HashSet<i16>) -> Result<Vec<(i32, i32)>, Vec<String>>;
    fn collapse_quant_flags(&mut self) -> Result<Vec<(i32, i32)>, String> ;
}

impl Collapser for Field {
    fn collapse_simple_tile(&mut self, x: i32, y: i32) -> Result<(), String> {
        let tile = self.get_mut_tile(x, y).ok_or(format!("Unfound tile at ({}, {})", x, y))?;
        
        if !tile.collapsed && tile.status != TileStatus::Opened {
            tile.collapsed = true;
            tile.prob = Prob(0);
        }
        else {
            return Err(format!("Tile ({}, {}) has been already opened or collapsed;", x, y));
        }
        return Ok(());
    }

    fn collapse_group(&mut self, target_mine : i16) -> Result<(), String> {
        let mut matching_indices: Vec<&mut Tile> = self.tiles
            .iter_mut().filter(|t| t.mine_id == target_mine).collect();

        if matching_indices.is_empty() {
            return Err(format!("Cant found tiles with that group ({})", target_mine));
        }
        if matching_indices[0].collapsed {
            return Err(format!("Tiles that group ({}) have been already collapsed.", target_mine));
        }
        for tile in &mut matching_indices {
            tile.collapsed = true;
            tile.prob = Prob(0);
        }
        let mine_index = fastrand::usize(0..matching_indices.len());
        if let Some(mine_tile) = matching_indices.get_mut(mine_index) {
            mine_tile.prob = Prob(12);
        }
        else {
            return Err(format!("Unfound mine candidate in group ({})", target_mine));
        }
        return Ok(());
    }

    fn collapse(&mut self, x: i32, y: i32) -> Result<(), String> {
        let tile = self.get_mut_tile(x, y).ok_or(format!("Tile at ({}, {}) isn't found", x, y))?;
        if tile.collapsed {
            return Err(format!("Tile ({}, {}) has been already collapsed.", x, y));
        }

        let mine_id = tile.mine_id;

        if mine_id == -1 {
            self.collapse_simple_tile(x, y)?;
            return Ok(());
        } else {
            self.collapse_group(mine_id)?;
            return Ok(());
        }
    }

    fn get_tiles_with_quant_flags(&self) -> HashSet<i16> {
        let mut quantum_groups = HashSet::new();
        
        for y in 0..self.height {
            for x in 0..self.width {
                if let Some(tile) = self.get_tile(x as i32, y as i32) {
                    if tile.status == TileStatus::QuantFlag {
                        quantum_groups.insert(tile.mine_id);
                    }
                }
            }
        }
        return quantum_groups;
    }

    fn collapse_quant_flag_groups(&mut self, quantum_groups : &HashSet<i16>) -> Result<Vec<(i32, i32)>, Vec<String>> {
        let mut error_bank : Vec<String> = Vec::new();
        let mut modificied : Vec<(i32, i32)> = Vec::new();
        for &group_id in quantum_groups {
            if group_id == -1 {
                for y in 0..self.height as i32 {
                    for x in 0..self.width as i32 {
                        if let Some(tile) = self.get_mut_tile(x, y) {
                            if tile.status == TileStatus::QuantFlag && tile.mine_id == -1 {
                                tile.collapsed = true;
                                tile.status = TileStatus::None;
                            }
                        }
                        modificied.push((x, y));
                        for (dx, dy) in DIRECTIONS {
                            modificied.push((x + dx, y + dy));
                        }
                    }
                }
            } else {
                let _ = self.collapse_group(group_id).unwrap_or_else(|e| error_bank.push(e));
                
                let group_coords = self.get_group_elements(group_id);
                for (x, y) in group_coords {
                    if let Some(tile) = self.get_mut_tile(x, y) {
                        tile.status = TileStatus::None;
                    }
                    modificied.push((x, y));
                    for (dx, dy) in DIRECTIONS {
                        modificied.push((x + dx, y + dy));
                    }
                }
            }
        }
        return Ok(modificied);
    }

    fn collapse_quant_flags(&mut self) -> Result<Vec<(i32, i32)>, String> {
        let quantum_groups = self.get_tiles_with_quant_flags();

        return Ok(self.collapse_quant_flag_groups(&quantum_groups)
            .map_err(|error_bank| error_bank.join("\n"))?);
    }
}