import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

import { w3cwebsocket as W3CWebSocket } from 'websocket';
//import Test from './components/Test';
import SideNav from './components/SideNav';
import CenterView from './components/CenterView';
import ModalFilter from './components/ModalFilter';

class App extends Component {
  constructor(props) {
    super(props)
    this.childCenterView = null;  // exposed CenterView object
    this.childModalFilter = null; // exposed ModalFilter object

    this.modalFilter = null;  // initalized in compDidMount

    //Clear timer if copy called again
    //Should I be using the States? ('this.setState')
    this.timeoutID = null;

    this.clientSocket = null;

    this.state = {
      socketState: 0
    }
  }

  componentDidMount() {
    this.modalFilter = document.getElementById('modal-filter');
  }

  componentWillMount() {
    this.establishClientSocket();
  }

  establishClientSocket(onOpenCallback = null) {
    this.clientSocket = new W3CWebSocket('ws://localhost:1366/');

    this.clientSocket.onerror = (e) => {
      console.log('Connection Error');
      this.setState({socketState: 1})
    }
    
    this.clientSocket.onopen = () => {
      console.log('WebSocket Client Connected');
      this.setState({socketState: 2})
      if (onOpenCallback) onOpenCallback(this.clientSocket);
    }

    this.clientSocket.onclose = () => {
      this.setState({socketState: 0})
      console.log('WebSocket Client Closed')
    }
  }

  reconnectClientSocket() {
    this.clientSocket.close();
    this.establishClientSocket(newClientSocket => {
      this.childCenterView.mountEventHandler(newClientSocket);
      this.childModalFilter.updateClientSocket(newClientSocket);
    });
  }

  triggerSnackbar(text = 'ackbar') {
    clearTimeout(this.timeoutID);
    let x = document.getElementById("snackbar");
    x.innerHTML = text;

    x.className = "show";
    // After 3 seconds, remove the show class from DIV
    this.timeoutID = setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);
  }

  activateModalFilter() {
    this.modalFilter.style.display = 'block';
  }

  render() {
    return (
      <div className="App">
        
        {/* <Test /> */}
        <div className="App-body">
          <SideNav 
            activateModalFilter={this.activateModalFilter.bind(this)}
            establishClientSocket={this.reconnectClientSocket.bind(this)}
            socketState={this.state.socketState}
          />
          <CenterView 
            ref={instance => { this.childCenterView = instance }}
            triggerSnackbar={this.triggerSnackbar}
            clientSocket={this.clientSocket}/>

          <ModalFilter 
            ref={instance => { this.childModalFilter = instance }}  
            clientSocket={this.clientSocket}
          />
        </div>
        <div id="snackbar"></div>
      </div>
    );
  }
}

export default App;
