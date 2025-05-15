use rand::rngs::ThreadRng;
use rand::thread_rng;

use crate::tile::*;

pub const DIRECTIONS : [(i32, i32); 8] = [(1,0), (-1,0), (0,1), (0,-1), (1,1), (1,-1), (-1,1), (-1,-1)];

pub struct Field {
    pub width: u32,
    pub height: u32,
    pub tiles: Vec<Tile>,
    pub rng : ThreadRng
}

impl Field {
    pub fn new(width: u32, height: u32) -> Field {
        return Field {
            width,
            height,
            tiles: (0..width*height).map(|_| Tile::new()).collect(),
            rng : thread_rng()
        };
    }    
}