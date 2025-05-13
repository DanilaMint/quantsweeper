use rand::thread_rng;

use crate::field::InternalField;
use crate::tile::Tile;

pub trait Byter {
    fn to_bytes(&self) -> Vec<u8>;
    fn from_bytes(bytes : &[u8]) -> Result<InternalField, &'static str>;
}

impl Byter for InternalField {
    fn to_bytes(&self) -> Vec<u8> {
        let mut result : Vec<u8> = Vec::new();
        result.extend(self.width.to_ne_bytes());
        result.extend(self.height.to_ne_bytes());
        for tile in &self.tiles {
            result.extend_from_slice(&tile.to_bytes());
        }
        return result;
    }

    fn from_bytes(bytes : &[u8]) -> Result<InternalField, &'static str> {
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
}