<?php

declare(strict_types=1);

namespace Bga\Games\israeliwhistshahar\States;

use Bga\GameFramework\StateType;
use Bga\Games\israeliwhistshahar\Game;
use Bga\Games\israeliwhistshahar\States\PlayerTurn;

class NextTrick extends \Bga\GameFramework\States\GameState
{
    public function __construct(protected Game $game)
    {
        parent::__construct($game, id: 33, type: StateType::GAME);
    }

    function onEnteringState(): string
    {
        // Reset trick color for the next trick
        $this->game->setGameStateValue("trickSuit", 0);

        return PlayerTurn::class;
    }
}
