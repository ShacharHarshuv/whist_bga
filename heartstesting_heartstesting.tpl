{OVERALL_GAME_HEADER}

<!--
--------
-- BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
-- HeartsTesting implementation : © Tom Golan tomgolanx@gmail.com
--
-- This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
-- See http://en.boardgamearena.com/#!doc/Studio for more information.
-------

    heartstesting_heartstesting.tpl

    This is the HTML template of your game.

    Everything you are writing in this file will be displayed in the HTML page of your game user interface,
    in the "main game zone" of the screen.

    You can use in this template:
    _ variables, with the format {MY_VARIABLE_ELEMENT}.
    _ HTML block, with the BEGIN/END format

    See your "view" PHP file to check how to set variables and control blocks

    Please REMOVE this comment before publishing your game on BGA
-->

<div id="game_board_wrap">
  <div id="playertables">

      <!-- BEGIN playerhandblock -->
      <div class="playertable whiteblock playertable_{DIR}">
          <div class="playertablename" style="color:#{PLAYER_COLOR}">{PLAYER_NAME}</div>
          <div class="playertablecard" id="playertablecard_{PLAYER_ID}"></div>
          <div class="tricks" id="tricks_wrap_{PLAYER_ID}">{TRICKS_LABEL} <span id="tricks_{PLAYER_ID}"></span></div>
          <div class="tricks" id="tricks_need_wrap_{PLAYER_ID}">{TRICKS_NEED_LABEL} <span id="tricks_need_{PLAYER_ID}"></span></div>
      </div>
      <!-- END playerhandblock -->
  </div>

  <div id="roundInfo">
    <div id="roundNumber">{ROUND}<span id="round"></span></div>
    <div id="roundtrump">{ROUND_TRUMP}<span id="round_trump_name"></span></div>
  </div>

  <div id="bidInfo">
    <form>
      <label for="tricks">Tricks:</label><br>
      <input type="number" id="bid_value" value="0" min="0" max="13" step="1" />
    </form>
  <select name="shapes" id="shape">
      <option value="1">Spade</option>
      <option value="2">Heart</option>
      <option value="3">Club</option>
      <option value="4">Diamond</option>
  </select>
  </div>
</div>

<div id="myhand_wrap" class="whiteblock">
    <h3>{MY_HAND}</h3>
    <div id="myhand">
    </div>
</div>

<script type="text/javascript">

// Javascript HTML templates

var jstpl_cardontable = '<div class="cardontable" id="cardontable_${player_id}" style="background-position:-${x}px -${y}px">\
                        </div>';

/*
// Example:
var jstpl_some_game_item='<div class="my_game_item" id="my_game_item_${MY_ITEM_ID}"></div>';

*/

</script>

{OVERALL_GAME_FOOTER}
