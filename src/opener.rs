use crate::field::{Field, DIRECTIONS};
use crate::misc::MiscMethods;
use crate::tile::*;
use crate::collapser::Collapser;

pub trait TileOpener {
    fn open_tile(&mut self, x : i32, y : i32) -> Result<bool, String>;
    fn multiopen(&mut self, x: i32, y: i32) -> Result<Vec<(i32, i32)>, String>;
}

impl TileOpener for Field {
    fn open_tile(&mut self, x : i32, y : i32) -> Result<bool, String> {
        let tile = self.get_tile(x, y).ok_or("Invalid coordinates")?;
    
        if tile.status != TileStatus::None {
            return Err(format!("Tile ({}, {}) already opened or there is a flag on it.", x, y));
        }

        let _ = self.collapse(x, y);

        let tile = self.get_mut_tile(x, y).ok_or("Invalid coordinates")?;
        tile.status = TileStatus::Opened;

        let tile = self.get_tile(x as i32, y as i32).ok_or(format!("Tile ({}, {}) unfound", x, y))?;
        return Ok(tile.prob >= Prob(12));
    }

    fn multiopen(&mut self, x: i32, y: i32) -> Result<Vec<(i32, i32)>, String> {
        let mut used = Vec::new();
        let mut stack = Vec::new();

        stack.push((x, y));
        used.push((x, y));

        while let Some((cx, cy)) = stack.pop() {
            let _ = self.open_tile(cx, cy);

            if self.around_prob_sum(cx, cy)? == Prob(0) {
                for (dx, dy) in DIRECTIONS {
                    let nx = cx + dx;
                    let ny = cy + dy;
                    if self.is_inside_bounds(nx, ny) && !used.contains(&(nx, ny)) {
                        used.push((nx, ny));
                        stack.push((nx, ny));
                    }
                }
            }
        }

        return Ok(used);
    }   
}
