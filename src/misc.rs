use crate::field::{InternalField, DIRECTIONS};
use crate::tile::*;

pub trait MiscMethods {
    fn is_inside_bounds(&self, x : i32, y : i32) -> bool;
    fn get_tile(&self, x: i32, y: i32) -> Option<&Tile>;
    fn get_mut_tile(&mut self, x: i32, y: i32) -> Option<&mut Tile>;
    fn coords_to_index(&self, x: i32, y: i32) -> Option<usize>;
    fn get_group_elements(&self, group_id : i8) -> Vec<(i32, i32)>;
    fn around_prob_sum(&self, x : i32, y : i32) -> Prob;
    fn set_tile_status(&mut self, x: i32, y: i32, status: TileStatus);
    fn is_win(&self) -> bool;
}

impl MiscMethods for InternalField {
    fn is_inside_bounds(&self, x : i32, y : i32) -> bool {
        return 0 <= x && 0 <= y && x < self.width as i32 && y < self.height as i32;
    }

    fn get_tile(&self, x: i32, y: i32) -> Option<&Tile> {
        let index = self.coords_to_index(x, y)?;
        return self.tiles.get(index);
    }

    fn get_mut_tile(&mut self, x: i32, y: i32) -> Option<&mut Tile> {
        let index = self.coords_to_index(x, y)?;
        return self.tiles.get_mut(index);
    }

    fn coords_to_index(&self, x: i32, y: i32) -> Option<usize> {
        if self.is_inside_bounds(x, y) {
            return Some((y * self.width as i32 + x) as usize);
        } 
        return None;
    }

    fn get_group_elements(&self, group_id : i8) -> Vec<(i32, i32)> {
        let mut group = Vec::new();
        let (width, height) = (self.width, self.height);
        for y in 0..height as i32 {
            for x in 0..width as i32 {
                if let Some(tile) = self.get_tile(x as i32, y as i32) {
                    if tile.group_id == group_id {
                        group.push((x, y));
                    }
                }
            }
        }

        return group;
    }

    fn around_prob_sum(&self, x : i32, y : i32) -> Prob {
        let mut result = Prob(0);

        for (dx, dy) in DIRECTIONS {
            if let Some(tile) = self.get_tile(x + dx, y + dy) {
                result.add(&tile.prob);
            }
        }

        return result;
    }

    fn set_tile_status(&mut self, x: i32, y: i32, status: TileStatus) {
        if let Some(tile) = self.get_mut_tile(x, y) {
            tile.status = status;
        }
    }

    fn is_win(&self) -> bool {
        self.tiles.iter().all(|tile| {
            match tile.prob {
                Prob(0) => tile.status == TileStatus::Opened,
                Prob(12) => tile.status == TileStatus::Flag,
                _ => false,
            }
        })
    }
}
