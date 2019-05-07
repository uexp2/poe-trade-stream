import React, { Component } from 'react';
import './SideNav.css'

class SideNav extends Component {
  constructor(props){
    super(props);
    
    this.testContext = this.context;

    this.socketState = props.socketState;
    
    this.state = {
      reconnTextColor: "red"
    }

    this.activateModalFilter = props.activateModalFilter;
    this.handleClick = this.handleClick.bind(this)
    this.establishClientSocket = props.establishClientSocket;
    this._translateSocketStateToColor = this._translateSocketStateToColor.bind(this);
    this._translateSocketStateToWord = this._translateSocketStateToWord.bind(this);
  }

  _translateSocketStateToColor() {
    switch (this.socketState){
      case 0:
        return "red"
      case 1:
        return "yellow"
      case 2:
        return "green"
    }
  }

  _translateSocketStateToWord() {
    switch (this.socketState){
      case 0:
        return "Reconnect"
      case 1:
        return "Error"
      case 2:
        return "Connected"
    }
  }

  componentWillReceiveProps(props) {
    this.socketState = props.socketState;
    this.setState({reconnTextColor: this._translateSocketStateToColor()})
  }

  componentDidMount() {
    console.log(this.context, 'sidenav');
  }

  handleClick(e) {
    e.preventDefault();
    console.log(e)
  }

  render() {
    return(
      <div className="SideNav">
        <h1 className="Title"></h1>
        <ul>
          <ButtonCard buttonContent="Filter" 
            onClick={this.activateModalFilter}
          />
          <ButtonCard buttonContent={this._translateSocketStateToWord()} 
            onClick={this.establishClientSocket} 
            style={{color: this._translateSocketStateToColor()}}
          />
        </ul>
      </div>
    );
  }
}

class ButtonCard extends Component {
  render() {
    return(
      <div className="ButtonCard" onClick={this.props.onClick}>
        <h1 style={this.props.style}> {this.props.buttonContent} </h1>
      </div>
    );
  }
}

export default SideNav;