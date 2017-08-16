import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { LoadingController, AlertController } from 'ionic-angular';
import { Http, Headers, RequestOptions } from '@angular/http';
import 'rxjs/add/operator/map';

import firebase from 'firebase';

@Injectable()
export class UserProvider {

  currentWeek: number;
  usersRef = firebase.database().ref('/pickm/users');

  currentUserId: Observable<String>;
  currentEmail: string;
  usersData: Observable<Object>;
  scheduleData: Observable<object>;
  teamsData: Observable<Object>;

  constructor(
    public http: Http,
    public loadingCtrl: LoadingController,
    public alertCtrl: AlertController
  ) {
  
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        this.currentUserId = new Observable(observer => {
          observer.next(user.uid);
        });
        this.currentEmail = user.email;
      } 
        
    });

    this.usersData = new Observable(observer => {
      this.usersRef.on('value', usersSnapshot => {
        observer.next(usersSnapshot.val());
      });
    });

    // Get current week
    firebase.database().ref('/pickm/currentWeek').once('value', currentWeek => {
      this.currentWeek = currentWeek.val();
    });    

    // Get schedule
    this.scheduleData = new Observable(observer => {
      firebase.database().ref('/pickm/schedule').on('value', scheduleSnapshot => {
        observer.next(scheduleSnapshot.val());
      });
    });

    // Get teams
    this.teamsData = new Observable (observer => {
      firebase.database().ref('/pickm/teams').on('value', teamsSnapshot => {
        observer.next(teamsSnapshot.val());
      });
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
    console.log('pick added');
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
        //TODO: Validate signup erros
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
      key: 'pk_test_0YBU57eM9Qz1iBcskOWEm28s',
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
