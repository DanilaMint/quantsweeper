use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Debug, PartialEq, Clone, PartialOrd)]
pub struct Prob(pub u8); // n / 12

impl Prob {
    pub fn new(value : u8) -> Prob {
        return Prob(value);
    }

    pub fn add(&mut self, other : &Prob) {
        self.0 += other.0;
    }
}

#[wasm_bindgen]
#[derive(Debug, Clone, PartialEq)]
pub enum TileStatus {
    None,       // 0
    Opened,     // 1
    Flag,       // 2
    QuantFlag   // 3
}

impl TileStatus {
    fn to_u8(&self) -> u8 {
        match self {
            TileStatus::Flag => return 2,
            TileStatus::QuantFlag => return 3,
            TileStatus::Opened => return 1,
            TileStatus::None => return 0
        }
    }

    fn from_u8(value : u8) -> Result<TileStatus, &'static str> {
        match value {
            0 => return Ok(TileStatus::None),
            1 => return Ok(TileStatus::Opened),
            2 => return Ok(TileStatus::Flag),
            3 => return Ok(TileStatus::QuantFlag),
            _ => return Err("")
        }
    } 
}

#[derive(Debug, Clone, PartialEq)]
pub struct Tile {
    pub status: TileStatus,
    pub prob: Prob,
    pub measured: bool,
    pub group_id: i8
}

impl Tile {
    pub fn new() -> Self {
        return Self {
            prob: Prob(0),
            measured: false,
            group_id: -1,
            status: TileStatus::None
        };
    }

    pub fn to_bytes(&self) -> [u8; 3] {
        let mut result : [u8; 3] = [0; 3];
        result[0] = self.status.to_u8() + 4 * self.measured as u8;
        result[1] = self.group_id as u8;
        result[2] = self.prob.0;
        return result;
    }

    pub fn from_bytes(bytes : &[u8]) -> Result<Tile, &'static str> {
        if bytes.len() == 3 {
            if let Ok(status) = TileStatus::from_u8(bytes[0] % 4) {
                let measured = bytes[0] / 4 > 0;
                let group_id = bytes[1] as i8;
                let prob = Prob(bytes[2]);
                return Ok(Tile {
                    measured,
                    group_id,
                    prob,
                    status
                });
            }
            return Err("Tile status isn't parsed.");
        }
        return Err("Data length isn't equal 3");
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parsing() {
        let tile_input = Tile {
            prob: Prob(45),
            group_id: -1,
            measured: true,
            status: TileStatus::None
        };
        let bytes = tile_input.to_bytes();
        let tile_output = Tile::from_bytes(&bytes).unwrap();
        
        assert_eq!(tile_input.group_id, tile_output.group_id);
        assert_eq!(tile_input.measured, tile_output.measured);
        assert_eq!(tile_input.status, tile_output.status);
        assert_eq!(tile_input.prob, tile_output.prob);
        assert_eq!(tile_input, tile_output);
    }

    #[test]
    fn test_unpacking() {
        let bytes : [u8; 3] = [0, 0, 0];
        let tile = Tile::from_bytes(&bytes);
        match tile {
            Ok(t) => println!("{:?}", t),
            Err(e) => println!("{}", e),
        }
    }
}