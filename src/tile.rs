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
/* 
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
*/

#[derive(Debug, Clone, PartialEq)]
pub struct Tile {
    pub status: TileStatus,
    pub prob: Prob,
    pub collapsed: bool,
    pub mine_id: i16
}

impl Tile {
    pub const fn new() -> Self {
        return Self {
            prob: Prob(0),
            collapsed: false,
            mine_id: -1,
            status: TileStatus::None
        };
    }

    pub fn from_mine(mine_id : i16, probability : Prob) -> Self {
        return Self {
            prob: probability,
            mine_id: mine_id,
            status: TileStatus::None,
            collapsed: false
        };
    }
    /* 
    pub fn to_bytes(&self) -> [u8; 3] {
        let mut result : [u8; 3] = [0; 3];
        result[0] = self.status.to_u8() + 4 * self.collapsed as u8;
        result[1] = self.group_id as u8;
        result[2] = self.prob.0;
        return result;
    }

    pub fn from_bytes(bytes : &[u8]) -> Result<Tile, &'static str> {
        if bytes.len() == 3 {
            if let Ok(status) = TileStatus::from_u8(bytes[0] % 4) {
                let collapsed = bytes[0] / 4 > 0;
                let group_id = bytes[1] as i8;
                let prob = Prob(bytes[2]);
                return Ok(Tile {
                    collapsed,
                    group_id,
                    prob,
                    status
                });
            }
            return Err("Tile status isn't parsed.");
        }
        return Err("Data length isn't equal 3");
    }
    */
}