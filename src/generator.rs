use fastrand;

use crate::field::Field;
use crate::misc::MiscMethods;
use crate::tile::Prob;

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

fn distribute_tiles(available_tiles: &Vec<usize>, groups: &mut Vec<Vec<usize>>, available_candidates: usize) {
    for id_tile in available_tiles.iter().take(available_candidates) {
        let candidate_indices: Vec<usize> = groups
            .iter()
            .enumerate()
            .filter(|(_, g)| g.len() < 4)
            .map(|(i, _)| i)
            .collect();
    
        if !candidate_indices.is_empty() {
            let group_idx = fastrand::choice(candidate_indices).unwrap();
            groups[group_idx].push(*id_tile);
        }
    }
}

pub trait Generator {
    fn generate(&mut self, first_click_x: i32, first_click_y: i32, group_percent: f64, supertile_percent: f64) -> Result<(), String>;

    fn get_available_tiles(&self, total_tiles : usize, fcx : i32, fcy : i32) -> Vec<usize>;
    fn set_probabilites(&mut self, groups : &Vec<Vec<usize>>) -> Result<(), String>;
}

impl Generator for Field {
    fn generate(&mut self, first_click_x: i32, first_click_y: i32, group_percent: f64, supertile_percent: f64) -> Result<(), String> {
        let total_tiles = (self.width * self.height) as usize;
        let total_groups = ((total_tiles - 1) as f64 * group_percent).round().max(1.0) as usize;
        let total_candidates = ((total_tiles - 1) as f64 * supertile_percent).round().max(1.0) as usize;
        
        let mut available_tiles = self.get_available_tiles(total_tiles, first_click_x, first_click_y);
        fastrand::shuffle(&mut available_tiles);

        let mut groups = make_groups(&mut available_tiles, total_groups)?;
        distribute_tiles(&available_tiles, &mut groups, total_candidates - total_groups);
        self.set_probabilites(&groups)?;

        return Ok(());
    }

    fn get_available_tiles(&self, total_tiles : usize, fcx : i32, fcy : i32) -> Vec<usize> {
        return (0..total_tiles).filter(|&i| i != self.coords_to_index(fcx, fcy).unwrap()).collect();
    }

    fn set_probabilites(&mut self, groups : &Vec<Vec<usize>>) -> Result<(), String> {
        for (mine_id, group) in groups.iter().enumerate() {
            let prob = match group.len() {
                1 => Prob(12),
                2 => Prob(6),
                3 => Prob(4),
                4 => Prob(3),
                _ => return Err(String::from("Invalid group size detected")),
            }; // скорее всего баг появлялся где-то здесь, и чтобы его исключить я сделал это

            for id in group {
                if let Some(tile) = self.tiles.get_mut(*id) {
                    tile.prob = prob.clone();
                    tile.mine_id = mine_id as i16;
                }
            }
        }
        return Ok(());
    }
}
