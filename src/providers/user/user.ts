import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { LoadingController, AlertController } from 'ionic-angular';
import { Http, Headers, RequestOptions } from '@angular/http';
import 'rxjs/add/operator/map';

import firebase from 'firebase';

import { HomePage } from '../../pages/home/home';
import { LandingPage } from '../../pages/landing/landing';

@Injectable()
export class UserProvider {

  usersRef = firebase.database().ref('/pickm/users');
  currentWeekRef = firebase.database().ref('/pickm/currentWeek');
  teamsRef = firebase.database().ref('/pickm/teams');
  scheduleRef = firebase.database().ref('/pickm/schedule');

  // TODO: Change these to BehaviorSubjects. Need to adjust initial value
  currentUserId: Observable<String>;
  currentEmail: string;
  usersData: BehaviorSubject<Object>;
  scheduleData: BehaviorSubject<any>;
  teamsData: BehaviorSubject<Object>;
  currentWeek: BehaviorSubject<any>;

  constructor(
    public http: Http,
    public loadingCtrl: LoadingController,
    public alertCtrl: AlertController,
  ) {
    console.log('loading user');
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        // TODO: Can get rid of this and just return user  from firebase.auth().user
        this.currentUserId = new Observable(observer => {
          observer.next(user.uid);
        });
        this.currentEmail = user.email;
      } 
    });

    this.usersData = new BehaviorSubject(
      this.usersRef.on('value', usersSnapshot => {
        this.usersData.next(usersSnapshot.val());
      })
    );
    
    // Get current week
    this.currentWeek = new BehaviorSubject(
      firebase.database().ref('/pickm/currentWeek').once('value', currentWeek => {
        this.currentWeek.next(currentWeek.val());
      })
    );


    // Get the schedule
    this.scheduleData = new BehaviorSubject(
      firebase.database().ref('/pickm/schedule').on('value', scheduleSnapshot => {
        this.scheduleData.next(scheduleSnapshot.val());
      })
    );

    // Get teams
    // this.teamsData = new BehaviorSubject(
    //   firebase.database().ref('/pickm/teams').on('value', teamsSnapshot => {
    //     this.teamsData.next(teamsSnapshot.val());
    //   })
    // )
    this.teamsData = new BehaviorSubject({});
    firebase.database().ref('/pickm/teams').on('value', teamsSnapshot => {
      this.teamsData.next(teamsSnapshot.val());
    });

  }

  addPick(picksToAdd) {
    let pickNumber = 0;
    this.usersRef.child(firebase.auth().currentUser.uid).child('picks').once('value', picksSnap => {
      pickNumber = picksSnap.numChildren();
    }).then(() => {
      for (var i = 0; i < picksToAdd; i++) {
        this.usersRef.child(firebase.auth().currentUser.uid).child('picks').child(pickNumber.toString()).set(this.newUserProfileObj());
        pickNumber++;
      }
    });
    this.sendAlert('Payment Successful', 'Good luck!');
  }

  signup(form) {
    let loader = this.loadingCtrl.create({
      content: "Creating Account...",
    });
    loader.present();  
    firebase.auth().createUserWithEmailAndPassword(form.email, form.password)
      .then(newUser=> {
        this.usersRef.child(newUser.uid).set({
          email: form.email,
          userName: form.username
        });
        loader.dismiss();
      })
      .catch((error)=> {
        loader.dismiss();
        console.log(error);
        if (error['code'] == 'auth/email-already-in-use') this.sendAlert("Something's wrong",'That email is taken.');
        else this.sendAlert("Something's wrong", 'Please try again.');
      });
  }

  login(form) {
    let loader = this.loadingCtrl.create({
      content: "Loading...",
    });
    loader.present();  
    firebase.auth().signInWithEmailAndPassword(form.email, form.password)
      .then(() => {
        //this.getCurrentUser();
        loader.dismiss();
      })
      .catch(error => {
        loader.dismiss();
        console.log(error);
        if (error['code'] == 'auth/user-not-found') this.sendAlert("Something's wrong",'Email not found.');
        else if (error['code'] == 'auth/wrong-password') this.sendAlert("Something's wrong",'Incorrect password.');
        else this.sendAlert("Something's wrong", 'Please try again.');
      });
  }

  sendAlert(title, message) {
    let alert = this.alertCtrl.create({
      title: title,
      message: message,
      buttons: ['Ok']
    });
    alert.present();
  }

  logout() {
    firebase.auth().signOut();
  }

  getUsers(): any {
    return this.usersRef;
  }

  // Helper methods
  newUserProfileObj(): any {
    var userObj = {
      alive: true,
      show: true,
      paid: false,
      gameWeeks: this.gameWeeks,
      teams: this.teams,
    }
    return userObj;
  }

  changePick(currentUserId, game, team, oldTeam, pickNumber) {
    // If there is an old team, mark it false in team node
    if (oldTeam) {
      this.usersRef.child(currentUserId).child('picks').child(pickNumber).child('teams')
        .child(oldTeam).set(false);
    }
    // Change gameWeek pick to new team
    let gameWeek = `gameWeek${game.gameWeek}`;
    this.usersRef.child(currentUserId).child('picks').child(pickNumber).child('gameWeeks')
      .child(gameWeek).set({
        team: team,
        gameId: game.gameId,
        locked: false,
        alive: true
      });

    // Set new team to true
    this.usersRef.child(currentUserId).child('picks').child(pickNumber).child('teams')
      .child(team).set(true);
  }

  openCheckout(numOfPicks) {
    
    let headers = new Headers({ 'Content-Type': 'application/json' }); //'Access-Control-Allow-Origin': "*" , 'Access-Control-Allow-Methods': 'GET, POST'});
    let options = new RequestOptions({ headers: headers });
    let handler = (<any>window).StripeCheckout.configure({
      key: 'pk_live_eavt23KHip9GEhPoIUs4LqOk',
      image: '../assets/images/icon.png',
      locale: 'auto',
      token: token => {
        // You can access the token ID with `token.id`.
        // Get the token ID to your server-side code for use.
        this.http.post('https://us-central1-mrcesarapp.cloudfunctions.net/chargePicks', {
          token: token.id,
          numPicks: numOfPicks
        }, options)
        .map(res => res.json())
        .subscribe(data => {
          loader.dismiss();
          if (data.object == "charge" && data.paid == true) {
            // Payment was successful
            this.addPick(data.numPicks);
          }
        });
      }
    });
    
    let loader = this.loadingCtrl.create({
      content: "Processing Payment...",
    });
    loader.present();

    handler.open({
      name: "Pick'm",
      email: this.currentEmail,
      description: `${numOfPicks} Pick(s)`,
      amount: numOfPicks * 2500,
      allowRememberMe: false
    });
  }


  lockGame(gameId, gameWeek, gameLocked) {
    // Lock the game in the schedule
    firebase.database().ref(`/pickm/schedule/gameWeek${gameWeek}`).once('value', snapshot => {
      snapshot.forEach((game) => {
        if (gameId == game.val().gameId) {
          game.ref.child('locked').set(!gameLocked);
        }
        return false;
      });
    });

    // Locking the game for each user
    this.usersRef.once('value', usersSnap => {
      usersSnap.forEach(user => {
        user.child('picks').forEach(pick => {
          let pickId = pick.val().gameWeeks[`gameWeek${gameWeek}`].gameId;
          if (pickId) {
            if (pickId == gameId) {
              pick.ref.child('gameWeeks').child(`gameWeek${gameWeek}`).child('locked').set(!gameLocked);
            }
          }
          return false;
        });
        return false;
      });
    });
  }

  setGameResults(game, results) {
    // let loader = this.loadingCtrl.create({
    //   content: 'Updating game results...'
    // });
    
    // Get the teams & schedule as objects
    let teams = this.teamsData.value;
    let schedule = this.scheduleData.value[`gameWeek${game.gameWeek}`];
    for (var gameData in schedule) {
      if (schedule[gameData]['gameId'] == game['gameId']) {
        // If Tie
        if (results == 'TIE') {
          this.scheduleRef.child(`gameWeek${game.gameWeek}`).child(gameData).child('winner').set(results);
          let currentTiesHome = teams[game.homeTeam].ties;
          let currentTiesAway = teams[game.awayTeam].ties;
          currentTiesAway += 1; currentTiesHome++;
          this.teamsRef.child(game.homeTeam).child('ties').set(currentTiesHome);
          this.teamsRef.child(game.awayTeam).child('ties').set(currentTiesAway);
        }
        else { // A team won
          // Set winner in schedule
          this.scheduleRef.child(`gameWeek${game.gameWeek}`).child(gameData).child('winner').set(results);
          // Adjust team records
          let winner = "", loser = "";
          if (game.homeTeam == results) {
            winner = game.homeTeam;
            loser = game.awayTeam;
          }
          else {
            loser = game.homeTeam;
            winner = game.awayTeam;
          }
          // Update winner's record
          let wins = teams[winner].wins;
          wins++;
          this.teamsRef.child(winner).child('wins').set(wins);
          // Update loser's record
          let losses = teams[loser].losses;
          losses++;
          this.teamsRef.child(loser).child('losses').set(losses);
        }
        game.winner = results;
        this.evalGame(game);
      }    
    }
  }

  evalGame(game) {
    // Iterate through user's picks for the gameWeek. If gameId matches, check if they lost
    this.usersRef.once('value', usersSnap => {
      usersSnap.forEach(userSnap => {
        userSnap.child('picks').forEach(pick => {
          let userPick = pick.val().gameWeeks[`gameWeek${game.gameWeek}`];
          if (userPick.gameId == game.gameId) {
            // Picked the game
            if (userPick.team != game.winner) {
              // If game is a tie or they
              pick.ref.child('gameWeeks').child(`gameWeek${game.gameWeek}`).child('alive').set(false);
            }
          }
          return false;
        });
        return false;
      });
    });
  }

  endWeek(week) {
    // Only run if all games are locked and in currentWeek
    // if user didn't make a pick, alive = false
    
    let allLocked = true;
    let schedule = this.scheduleData.value[`gameWeek${week}`];

    for (var gameId in schedule) {
      if (!schedule[gameId].locked || schedule[gameId].winner == "") allLocked = false;
    }

    if (!allLocked) {
      this.sendAlert('Week not finished', 'Lock all games.');
    }
    else {
      // Iterate through users. If user/alive, check if lost or no pick
      this.usersRef.once('value', usersSnap => {
        usersSnap.forEach(userSnap => {
          userSnap.child('picks').forEach(pick => {
            if (pick.val().alive) {
              let userPick = pick.val().gameWeeks[`gameWeek${week}`];
              console.log(`${userSnap.val().userName} is alive`);
              console.log(userPick);
              let message;
              // If no pick made
              if (!userPick.team) {
                message = `You did not make a pick on week ${week}`;
                pick.ref.child('alive').set(false);
                pick.ref.child('message').set(message);
                pick.ref.child('gameWeeks').child(`gameWeek${week}`).child('alive').set(false);
              }
              if (!userPick.alive) {
                console.log('found a dead user');
                message = `Your team lost on week ${week}`;
                pick.ref.child('alive').set(false);
                pick.ref.child('message').set(message);
              }
            }
            return false;
          });
          return false;
        });
      });
      firebase.database().ref('/pickm/currentWeek').set(week + 1);
      this.sendAlert('AllDone', 'On to the next week');
    }

  }

  private gameWeeks = {
    gameWeek1: {alive: true, gameId: "", locked: false, team: ""},
    gameWeek2: {alive: true, gameId: "", locked: false, team: ""},
    gameWeek3: {alive: true, gameId: "", locked: false, team: ""},
    gameWeek4: {alive: true, gameId: "", locked: false, team: ""},
    gameWeek5: {alive: true, gameId: "", locked: false, team: ""},
    gameWeek6: {alive: true, gameId: "", locked: false, team: ""},
    gameWeek7: {alive: true, gameId: "", locked: false, team: ""},
    gameWeek8: {alive: true, gameId: "", locked: false, team: ""},
    gameWeek9: {alive: true, gameId: "", locked: false, team: ""},
    gameWeek10: {alive: true, gameId: "", locked: false, team: ""},
    gameWeek11: {alive: true, gameId: "", locked: false, team: ""},
    gameWeek12: {alive: true, gameId: "", locked: false, team: ""},
    gameWeek13: {alive: true, gameId: "", locked: false, team: ""},
    gameWeek14: {alive: true, gameId: "", locked: false, team: ""},
    gameWeek15: {alive: true, gameId: "", locked: false, team: ""},
    gameWeek16: {alive: true, gameId: "", locked: false, team: ""},
    gameWeek17: {alive: true, gameId: "", locked: false, team: ""}
  };

  private teams = {
    'ARI': false,'ATL': false,'BAL': false,'BUF': false,'CAR': false,
    'CHI': false,'CIN': false,'CLE': false,'DAL': false,'DEN': false,
    'DET': false,'GB': false,'HOU': false,'IND': false,'JAC': false,
    'KC': false,'LAR': false,'MIA': false,'MIN': false,'NE': false,
    'NO': false,'NYG': false,'NYJ': false,'OAK': false,'PHI': false,
    'PIT': false,'LAC': false,'SEA': false,'SF': false,'TB': false,
    'TEN': false,'WAS': false
  };
}
