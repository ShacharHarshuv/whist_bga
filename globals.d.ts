declare var dojo: any;
declare var ebg: {
  core: {
    gamegui: any;
  };
  counter: any;
  stock: any;
};
declare var html: any;
declare var define: any;
declare var _: (s: string) => string;
declare var $: any;
declare var g_gamethemeurl: string;

interface Document {
  getElementById(elementId: string): HTMLElement;
}

interface GameGui {}

interface Card {
  id: string;
  type: string;
  type_arg: string;
  location: string;
  location_arg: string;
}

interface Player {
  id: string;
  color: string;
  name: string;
  score: string;
  taken: string;
  tricks: string;
}

interface GameDatas {
  players: {
    [player_id: number]: Player;
  };
  hand: Card[];
  cardsontable: Card[];
  roundNumber: number;
  round_trump: number;
}
