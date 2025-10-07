<?php

declare(strict_types=1);

namespace Bga\Games\israeliwhist\States;

use Bga\GameFramework\StateType;
use Bga\Games\israeliwhist\Game;
use Bga\GameFramework\States\PossibleAction;

class PlayerDeclaration extends \Bga\GameFramework\States\GameState
{
    public function __construct(protected Game $game)
    {
        parent::__construct(
            $game,
            id: 25,
            type: StateType::ACTIVE_PLAYER,
            description: clienttranslate(
                '${actplayer} must declare how many tricks they will win'
            ),
            descriptionMyTurn: clienttranslate(
                '${you} must declare how many tricks you will win'
            )
        );
    }

    #[PossibleAction]
    public function actDeclare(int $value, int $activePlayerId)
    {
        $currentBidPlayerId = $this->game->getGameStateValue(
            "currentBidPlayerId"
        );
        $currentBidValue = $this->game->getGameStateValue("currentBidValue");

        if (
            $activePlayerId == $currentBidPlayerId &&
            $value < $currentBidValue
        ) {
            throw new \BgaVisibleSystemException(
                clienttranslate("Bet cannot be smaller then bid value")
            );
        }

        $numberOfContracts = $this->game->getGameStateValue(
            "numberOfContracts"
        );

        $numberOfContracts = $numberOfContracts + 1;

        $contractsSum = $this->game->getGameStateValue("contractsSum");
        $nextContractsSum = $contractsSum + $value;

        if ($numberOfContracts == 4 && $nextContractsSum == 13) {
            throw new \BgaVisibleSystemException(
                clienttranslate("Total bets value cannot be exactly 13")
            );
        }

        $this->game->setGameStateValue("contractsSum", $nextContractsSum);
        $this->game->setGameStateValue("numberOfContracts", $numberOfContracts);

        $this->game->DbQuery(
            "UPDATE player SET contract=$value WHERE player_id='$activePlayerId'"
        );

        $this->notify->all(
            "playerContract",
            clienttranslate(
                '${player_name} declared they will win ${value} tricks'
            ),
            [
                "player_name" => $this->game->getActivePlayerName(),
                "player_id" => $activePlayerId,
                "value" => $value,
            ]
        );

        return NextDeclaration::class;
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
}
