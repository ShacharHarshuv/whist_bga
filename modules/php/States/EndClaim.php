<?php
declare(strict_types=1);

namespace Bga\Games\israeliwhist\States;

use Bga\GameFramework\StateType;
use Bga\Games\israeliwhist\Game;
use Bga\GameFramework\States\PossibleAction;
use Bga\Games\israeliwhist\States\TakeCards;

class EndClaim extends \Bga\GameFramework\States\GameState
{
    public function __construct(protected Game $game)
    {
        parent::__construct($game, id: 42, type: StateType::GAME);
    }

    function onEnteringState()
    {
        // todo: award player remaining tricks and notify clients
        return EndHand::class;
    }
}
