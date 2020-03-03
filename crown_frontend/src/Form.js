import React, { Component } from 'react'

class Form extends Component {
  constructor(props) {
    super(props)

    this.initialState = {
      question: ''
    };

    this.state = this.initialState
  }
  
  handleChange = event => {
  const { name, value } = event.target

  this.setState({
    [name]: value

  })
}


submitForm = event => {
  event.preventDefault()
  this.props.handleSubmit(this.state.question)
  this.setState(this.initialState)
  
}


 showInfoText = event => {
     
 }

clearConv = () => {
    this.props.handleClearConv()
}

clearLastTurn = () => {
    this.props.handleClearLastTurn()
}
  
render() {
   
  var divstyle = {display: "inline", flexDirection: "row",  justifyContent: "center"}
  var right = {marginRight: "10px"}
  var bottom = { "marginBottom": "40px"}
  
  return (
    <form onSubmit={this.submitForm} style={bottom}>
     <div style={divstyle}>
     <input
        type="text"
        name="question"
        value={this.state.question}
        onChange={this.handleChange}
        placeholder="Please enter your question"  style={right}/>
        
        <input type="button" value="Answer" onClick={this.submitForm} title="Click here to find answer to the current question (information from previous questions is taken into account)"  />
      
        <input type="button" value="Clear All"  onClick={this.clearConv} title="Clear entire conversation to start asking about a different topic" />     
        
        <input type="button" value="Clear Last"  onClick={this.clearLastTurn} title="Clear results for the last turn only" />  
   </div>
    </form>
  
    );
}
 
}


export default Form;