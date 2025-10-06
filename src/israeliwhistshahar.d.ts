/**
 * Israeli Whist game interfaces
 */

interface Card {
  id: number;
  location: string;
  location_arg: number;
  type: number;
  type_arg: number;
}

interface IsraeliWhistShaharPlayer extends Player {
  cards: Card[];
  hand_size: number;
  tricks_won: number;
  bid: number;
  score_round: number;
}

interface IsraeliWhistShaharGamedatas {
  current_player_id: string;
  decision: { decision_type: string };
  game_result_neutralized: string;
  gamestate: Gamestate;
  gamestates: { [gamestateId: number]: Gamestate };
  neutralized_player_id: string;
  notifications: { last_packet_id: string; move_nbr: string };
  playerorder: (string | number)[];
  players: { [playerId: number]: IsraeliWhistShaharPlayer };
  tablespeed: string;

  // Game specific data
  cards: { [cardId: number]: Card };
  hand: Card[];
  cardsontable: Card[];
  trump: number;
  round: number;
  max_rounds: number;
  bids: { [playerId: number]: number };
  tricks: { [playerId: number]: number };
}
