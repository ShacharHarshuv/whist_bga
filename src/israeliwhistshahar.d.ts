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

interface IsraeliWhistPlayer extends Player {
  cards: Card[];
  hand_size: number;
  tricks_won: number;
  bid: number;
  score_round: number;
}

// todo: see if we can simplify this
interface IsraeliWhistGamedatas extends Gamedatas<IsraeliWhistPlayer> {
  current_player_id: string;
  decision: { decision_type: string };
  game_result_neutralized: string;
  neutralized_player_id: string;
  notifications: { last_packet_id: string; move_nbr: string };
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
