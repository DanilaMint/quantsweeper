use std::collections::HashSet;
use rand::rngs::ThreadRng;
use rand::seq::SliceRandom;
use rand::thread_rng;

use crate::tile::*;

static DIRECTIONS : [(i32, i32); 8] = [(1,0), (-1,0), (0,1), (0,-1), (1,1), (1,-1), (-1,1), (-1,-1)];

pub struct InternalField {
    pub width: u32,
    pub height: u32,
    pub tiles: Vec<Tile>,
    rng : ThreadRng,
}

impl InternalField {
    pub fn new(width: u32, height: u32) -> InternalField {
        return InternalField {
            width,
            height,
            tiles: (0..width*height).map(|_| Tile::new()).collect(),
            rng : thread_rng()
        };
    }

    // методы, связанные с генерацией

    fn make_groups(available_tiles : &mut Vec<usize>, total_groups : usize) -> Result<Vec<Vec<usize>>, String> {
        let mut groups : Vec<Vec<usize>> = (0..total_groups).map(|_| Vec::new()).collect();
        if available_tiles.len() < total_groups {
            return Err(format!("Group count more than tiles ({}), max: {}", total_groups, available_tiles.len()));
        }

        for (group_id, id) in available_tiles.drain(0..total_groups).enumerate() {
            if let Some(group) = groups.get_mut(group_id) {
                group.push(id);
            }
        }

        return Ok(groups);
    }

    fn get_available_tiles(&self, total_tiles : usize, fcx : i32, fcy : i32) -> Vec<usize> {
        return (0..total_tiles).filter(|&i| i != self.coords_to_index(fcx, fcy).unwrap()).collect();
    }

    fn distribute_tiles(&mut self, available_tiles: &Vec<usize>, groups: &mut Vec<Vec<usize>>, available_candidates: usize) {
        for id_tile in available_tiles.iter().take(available_candidates) {
            let candidate_indices: Vec<usize> = groups
                .iter()
                .enumerate()
                .filter(|(_, g)| g.len() < 4)
                .map(|(i, _)| i)
                .collect();
        
            if !candidate_indices.is_empty() {
                let group_idx = *candidate_indices.choose(&mut self.rng).unwrap();
                groups[group_idx].push(*id_tile);
            }
        }
    }

    fn set_probabilites(&mut self, groups : &Vec<Vec<usize>>) -> Result<(), String> {
        for (group_id, group) in groups.iter().enumerate() {
            let prob = match group.len() {
                1 => Prob(12),
                2 => Prob(6),
                3 => Prob(4),
                4 => Prob(3),
                _ => return Err(String::from("Invalid group size detected")),
            }; // скорее всего баг появляется где-то здесь, и чтобы его исключить я сделал это

            for id in group {
                if let Some(tile) = self.tiles.get_mut(*id) {
                    tile.prob = prob.clone();
                    tile.group_id = group_id as i8;
                }
            }
        }
        return Ok(());
    }

    pub fn generate(&mut self, first_click_x: i32, first_click_y: i32, group_percent: f64, supertile_percent: f64) -> Result<(), String> {
        let total_tiles = (self.width * self.height) as usize;
        let total_groups = ((total_tiles - 1) as f64 * group_percent).round().max(1.0) as usize;
        let total_candidates = ((total_tiles - 1) as f64 * supertile_percent).round().max(1.0) as usize;
        
        let mut available_tiles = self.get_available_tiles(total_tiles, first_click_x, first_click_y);
        available_tiles.shuffle(&mut self.rng);

        let mut groups = InternalField::make_groups(&mut available_tiles, total_groups)?;
        self.distribute_tiles(&available_tiles, &mut groups, total_candidates - total_groups);
        self.set_probabilites(&groups)?;

        return Ok(());
    }

    // коллапс

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

    pub fn measure(&mut self, x: i32, y: i32) -> Result<(), &str> {
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

    // коллапс по квантовым флажкам

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

    pub fn measure_quant_flags(&mut self) {
        let quantum_groups = self.get_tiles_with_quant_flags();
        self.measure_quant_flag_groups(&quantum_groups);
    }

    // открытие клетки

    pub fn open_tile(&mut self, x : i32, y : i32) -> Result<bool, &str> {
        let tile = self.get_mut_tile(x, y).ok_or("Invalid coordinates")?;
    
        if tile.status != TileStatus::None {
            return Err("Tile already opened or there is a flag on it.");
        }

        tile.status = TileStatus::Opened;

        let _ = self.measure(x, y);

        let tile = self.get_tile(x as i32, y as i32).unwrap();
        return Ok(tile.prob > Prob(12));
    }

    pub fn multiopen(&mut self, x: i32, y: i32) -> Vec<(i32, i32)> {
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

    // проставление флажков

    pub fn set_tile_status(&mut self, x: i32, y: i32, status: TileStatus) {
        if let Some(tile) = self.get_mut_tile(x, y) {
            tile.status = status;
        }
    }

    // получение вероятностей вокруг

    pub fn around_prob_sum(&self, x : i32, y : i32) -> Prob {
        let mut result = Prob(0);

        for (dx, dy) in DIRECTIONS {
            if let Some(tile) = self.get_tile(x + dx, y + dy) {
                result.add(&tile.prob);
            }
        }

        return result;
    }

    // сохранение/загрузка

    pub fn to_bytes(&self) -> Vec<u8> {
        let mut result : Vec<u8> = Vec::new();
        result.extend(self.width.to_ne_bytes());
        result.extend(self.height.to_ne_bytes());
        for tile in &self.tiles {
            result.extend_from_slice(&tile.to_bytes());
        }
        return result;
    }

    pub fn from_bytes(bytes : &[u8]) -> Result<InternalField, &'static str> {
        if bytes.len() >= 8 {
            let width = u32::from_ne_bytes(bytes[0..4].try_into().unwrap());
            let height = u32::from_ne_bytes(bytes[4..8].try_into().unwrap());
            println!("{}x{}", width, height);
            let mut tiles : Vec<Tile> = Vec::new();
            let total = width.checked_mul(height).ok_or("Mul size overflow")?;
            if bytes.len() < 8 + total as usize * 3 {
                return Err("Data lose some tiles");
            }
            for i in 0..total {
                let start = 8u32.checked_add(i.checked_mul(3).ok_or("Mul overflow")?).ok_or("Offset overflow")? as usize;
                let end = start.checked_add(3).ok_or("End offset overflow")? as usize;
                let range = start..end;

                let slice = &bytes[range];
                let tile = Tile::from_bytes(slice);
                tiles.push(tile?);
            }
            return Ok(InternalField {width, height, tiles, rng: thread_rng()});
        }
        return Err("Data length less than 8 (size isn't defined)");
    }

    // остальное

    fn is_inside_bounds(&self, x : i32, y : i32) -> bool {
        return 0 <= x && 0 <= y && x < self.width as i32 && y < self.height as i32;
    }

    pub fn get_tile(&self, x: i32, y: i32) -> Option<&Tile> {
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

    pub fn get_group_elements(&self, group_id : i8) -> Vec<(i32, i32)> {
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
}

#[cfg(test)]
mod tests {
    use super::InternalField;

    #[test]
    fn test_parsing() {
        let mut field = InternalField::new(10, 8);
        let _ = field.generate(0, 0, 0.1, 0.2);
        let bytes = field.to_bytes();

        let restored_field = InternalField::from_bytes(&bytes).unwrap();

        assert_eq!(field.width, restored_field.width);
        assert_eq!(field.height, restored_field.height);
        assert_eq!(field.tiles, restored_field.tiles);
    }

    #[test]
    fn generate() {
        let w = 10u32;
        let h = 10u32;
        let mut field = InternalField::new(w, h);
        let _ = field.generate(0, 0, 0.1, 0.2);
        
        for y in 0..h {
            for x in 0..w {
                let index = (x + w * y) as usize;
                let tile = &field.tiles[index];
                println!("{}: {:?}", index, tile);
            }
        }
    }

    #[test]
    fn test_prob_around() {
        let bytes: [u8; 35] = [
                3,0,0,0, 3,0,0,0, // размеры
                0,0,0, 0,0,3, 0,0,4,
                0,0,0, 0,0,0, 0,0,6,
                0,0,0, 0,0,0, 0,0,0
        ];
        match InternalField::from_bytes(&bytes) {
            Ok(field) => {
                for y in 0..3 {
                    for x in 0..3 {
                        let index = (x + 3 * y) as usize;
                        let tile = &field.tiles[index];
                        println!("{}: {:?}", index, tile);
                    }
                }
                println!("{:?}", field.around_prob_sum(1, 1));
            },
            Err(e) => println!("{}", e)
        }
    }

    #[test]
    fn test_multiopen() {
        let mut field = InternalField::new(6, 6);
        let _ = field.generate(3, 2, 0.05, 0.1);

        for y in 0..6 {
            println!("-------------------");
            for x in 0..6 {
                let index = (x + 6 * y) as usize;
                let tile = &field.tiles[index];
                println!("{}: {:?}", index, tile);
            }
        }
        field.multiopen(3, 2);
        println!("\n\n");
        for y in 0..6 {
            println!("-------------------");
            for x in 0..6 {
                let index = (x + 6 * y) as usize;
                let tile = &field.tiles[index];
                println!("{}: {:?}", index, tile);
            }
        }
    }
}

/*
Байтовые протоколы

Tile 6 байт: 
    0 - статус клетки (первые 2 бита) и измеренность (3 бит)
    1 - запутанная группа
    2..6 - вероятность мины

InternalField:
    0..4 - ширина
    4..8 - высота
    8.. - клетки
*/
