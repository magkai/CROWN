import React, { Component } from 'react'

class Options extends Component {
 
  
  
  
  handleChange = event => {
    const { name, value } = event.target;
  
    this.props.onChange(name, value);
   
   }  
   
   restore = () => {
     this.props.onRestore()

   }
   

  
  render() {
    const { retNbr, indriRetNbr, nodeThreshold, edgeThreshold, convquery, h1, h2, h3, h4 } = this.props;

    var inlinestyle = {display: "inline", width: "80%"} 
    var widthstyle = { width: "50%"}
    var tablelayout = {border: "0"}
    var align = {"textAlign": "center"}
     var marginbutton = {"textAlign": "left"};


    return (
        <div className="input-field text-defoptions">
        <table>
            <thead>
                <tr key={'options'}>
                    <th colSpan='2'>Advanced Options</th>
                    
                </tr>
            </thead>
            <tbody>
                <tr  key={'retnbr'}>
                    <td title="Number of passages returned per turn"><b>Number of Results (1, ..., 20):</b> </td>
                    <td>
                        <input type="text" name="retNbr" placeholder="3" value={retNbr} onChange={this.handleChange}  style={inlinestyle} />
                       
                    </td>   
                    
                </tr>
                <tr key={'indriretnbr'}>
                    <td title="Number of passages returned from Indri and used for re-ranking"><b>Number of Indri Passages (10, ..., 1000): </b> </td>
                    <td>
                        <input type="text" name="indriRetNbr" placeholder="100" value={indriRetNbr} onChange={this.handleChange} style={inlinestyle}/>
                    </td>

                </tr>
                <tr key={'nodethreshold'}>
                    <td title="Node weights correspond to similiarity between passage token and question token. Only node weights above this threshold are considered." style={widthstyle} ><b>Node Weight Threshold (0.5, ..., 1.0): </b> </td>
                    <td>
                        <input type="text" name="nodeThreshold" placeholder="0.75" value={nodeThreshold} onChange={this.handleChange} style={inlinestyle}/>
                    </td>

                </tr>
                <tr key={'edgethreshold'}>
                    <td title="Edge weights correspond to co-occurence of relevant terms inside context window. Only edge weights above this threshold are considered"><b>Edge Weight Threshold (0.0, ..., 0.1): </b> </td>
                    <td>         
                        <input type="text" name="edgeThreshold" placeholder="0.01" value={edgeThreshold} onChange={this.handleChange} style={inlinestyle}/>
                    </td>

                </tr>
                <tr key={'convquery'}>
                   
                    <td title="Determines which turns are used for query expansion and which weight the terms from a respective turn receive"><b>Conversational Query Model</b></td>
                    <td><select id="convquery" name="convquery" value={convquery} onChange={this.handleChange} style={inlinestyle}>
                        <option defaultValue="conv_w1">only current+previous+first turns used, previous turn decayed</option>
                        <option value="conv_uw">only current+first turns used</option> 
                        <option value="conv_w2">all turns proportionate weights</option>  
                                
                    </select>

                    </td>

                </tr>
                <tr key={'hyperparameters'} className="no-bottom-border">

                    <td title="The final score of each passage consists of a weighted sum of four different scores. The weight of each score is determined here." colSpan = "2">
                        <table style={tablelayout}>

                            <thead>
                                <tr key={'hyperparamters_heading'}>
                                    <th colSpan="4">Hyperparameters for Scoring (values must sum up to 1.0)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="no-bottom-border" key={"scores"}>                             
                               
                                    <td style={align}>
                                        <label htmlFor="h1">h1 (Indri score)</label>
                                        <input type="text" name="h1" placeholder="0.4" value={h1} onChange={this.handleChange} style={align}/>
                                    </td>
                                    <td style={align}>
                                        <label htmlFor="h2">h2 (Node score)</label>
                                        <input type="text" name="h2" placeholder="0.3" value={h2} onChange={this.handleChange} style={align}/>
                                    </td>
                                    <td style={align}>
                                        <label htmlFor="h3">h3 (Edge score)</label>
                                        <input type="text" name="h3" placeholder="0.2" value={h3} onChange={this.handleChange} style={align}/>
                                    </td>
                                    <td style={align}>
                                        <label htmlFor="h4">h4 (Position score)</label>
                                        <input type="text" name="h4" placeholder="0.1" value={h4} onChange={this.handleChange} style={align}/>
                                    </td>
                                    
                                </tr>
                                
                            </tbody>
                        </table>
                    </td>   
                </tr>
                <tr >
               <td colSpan='2'><input type="button" value="Restore Defaults" onClick={this.restore} title="Click here to restore the default options"  style={marginbutton}/>
      </td>
                </tr>
               <tr >
               <td colSpan='2'><center><b>Info:</b> To know more about a concept, simply hover your mouse above it.</center></td>
                </tr>
            </tbody>
        </table> 
       
        </div>
    );
}


}



export default Options;