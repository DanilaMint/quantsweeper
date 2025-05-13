use crate::field::{InternalField, DIRECTIONS};
use crate::misc::MiscMethods;
use crate::tile::*;
use crate::collapser::Collapser;

pub trait TileOpener {
    fn open_tile(&mut self, x : i32, y : i32) -> Result<bool, &str>;
    fn multiopen(&mut self, x: i32, y: i32) -> Vec<(i32, i32)>;

}

impl TileOpener for InternalField {
    fn open_tile(&mut self, x : i32, y : i32) -> Result<bool, &str> {
        let tile = self.get_mut_tile(x, y).ok_or("Invalid coordinates")?;
    
        if tile.status != TileStatus::None {
            return Err("Tile already opened or there is a flag on it.");
        }

        tile.status = TileStatus::Opened;

        let _ = self.measure(x, y);

        let tile = self.get_tile(x as i32, y as i32).unwrap();
        return Ok(tile.prob > Prob(12));
    }

    fn multiopen(&mut self, x: i32, y: i32) -> Vec<(i32, i32)> {
        let mut used = Vec::new();
        let mut stack = Vec::new();

        stack.push((x, y));
        used.push((x, y));

        while let Some((cx, cy)) = stack.pop() {
            // Помечаем клетку как открытую
            if let Some(tile) = self.get_mut_tile(cx, cy) {
                if tile.status == TileStatus::None{
                    tile.measured = true;
                    tile.status = TileStatus::Opened;
                }
            }

            // Открываем соседей только если вокруг нет мин
            if self.around_prob_sum(cx, cy) == Prob(0) {
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

        return used;
    }   
}