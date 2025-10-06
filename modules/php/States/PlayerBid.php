<?php

declare(strict_types=1);

namespace Bga\Games\israeliwhistshahar\States;

use Bga\GameFramework\StateType;
use Bga\Games\israeliwhistshahar\Game;
use Bga\GameFramework\States\PossibleAction;

class PlayerBid extends \Bga\GameFramework\States\GameState
{
    public function __construct(protected Game $game)
    {
        parent::__construct(
            $game,
            id: 20,
            type: StateType::ACTIVE_PLAYER,
            description: clienttranslate(
                '${actplayer} must make a bid or pass'
            ),
            descriptionMyTurn: clienttranslate('${you} must make a bid or pass')
        );
    }

    public function zombie(int $playerId)
    {
        // We must implement this so BGA can auto play in the case a player becomes a zombie, but for this tutorial we won't handle this case
        throw new \BgaUserException(
            'Not implemented: zombie for player ${player_id}',
            args: [
                "player_id" => $playerId,
            ]
        );
    }

    // TODO: check if the logic is implemented in Game.php and move it here

    #[PossibleAction]
    public function pass()
    {
        throw new \BgaUserException("Not implemented: pass");
    }

    #[PossibleAction]
    public function bid(int $value, int $suit)
    {
        throw new \BgaUserException("Not implemented: bid");
    }
}
