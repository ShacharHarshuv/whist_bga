/**
 * Israeli Whist game interfaces
 */

interface Card {
  id: number;
  type: number; // suit (1-4)
  type_arg: number; // value (2-14)
}

interface ServerCard extends Card {
  location: string;
  location_arg: number;
}

interface IsraeliWhistPlayer extends Player {
  cards: Card[];
  // values below need to be converted to numbers
  contract: string;
  bid_suit: string;
  bid_value: string;
  taken: string;
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
  cardsontable: ServerCard[];
  trump: string;
  round: string;
  max_rounds: string;
  bids: { [playerId: number]: number };
  tricks: { [playerId: number]: number };
  trickSuit: string;
  roundNumber: string;
  numberOfRounds: string;
  frischCounter: string;
  claimingPlayerId: string;
  claimingPlayerCards: Card[];
}
