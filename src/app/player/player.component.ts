import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { webSocket } from "rxjs/webSocket";
import { Message } from '../types';
import { MessageType } from '../enums';
const ws = webSocket("wss://qqhbc125y4.execute-api.us-east-2.amazonaws.com/production/");

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.css']
})
export class PlayerComponent implements OnInit {
  gameId: string = '';
  constructor(private activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this.gameId = (String)(this.activatedRoute.snapshot.paramMap.get('gameId'));
    ws.subscribe(
      (msg: any) => this.handleServerMessage(msg.data),
      err => {
        console.error(err);
        alert(`Websocket Error: ${err}`);
      },
      () => console.log('complete')
    );
  }

  handleServerMessage(msg: string) {
		const message = JSON.parse(msg) as Message;
		if (message.type === MessageType.CreateDoodle) {
			setDoodleAssignment(message.value);
			setComponent(PlayerComponent.CreateAssignmentDoodle)
		} else if (message.type === MessageType.WaitingForOtherPlayers) {
			console.log("waiting for other players to guess");
			setComponent(PlayerComponent.WaitingForOtherPlayers);
		} else if (message.type === MessageType.MakeAGuess) {
			console.log("ready to guess");
			setComponent(PlayerComponent.PlayersFirstGuess);
		} else if (message.type === MessageType.ChooseYourAnswer) {
			console.log("ready to guess again");
			setComponent(PlayerComponent.PlayersSecondGuess);
			var updateOptions = JSON.parse(message.value) as Array<string>;
			setOptions(updateOptions);
		}
	}

  joinGame(playerName: string, doodleURL: string) {
		var addPlayer = {
			name: playerName,
			imageUrl: doodleURL,
		} as AddPlayerMessage;
		var jsonAddPlayer = JSON.stringify(addPlayer);
		sendMessage(MessageType.AddPlayer, jsonAddPlayer);
	}

  submitAssignmentDoodle(doodleURL: string) {
		sendMessage(MessageType.SubmitAssignmentDoodle, doodleURL);
	}

  submitFirstGuess(guess: string) {
		sendMessage(MessageType.SubmitFirstGuess, guess);
	}

  submitSecondGuess(guess: string) {
		sendMessage(MessageType.SubmitSecondGuess, guess);
	}

  sendMessage(type: MessageType, value: string) {
		var msg = {
			action: sendMessageAction,
			type: type,
			recipientConnectionId: gameId,
			senderConnectionId: '',
			value: value,
		} as Message;
		var jsonRequest = JSON.stringify(msg);
		if (ws.current !== undefined) {
			ws.current.send(jsonRequest);
		}
	}


}
