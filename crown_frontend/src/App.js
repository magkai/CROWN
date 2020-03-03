import React, { Component } from 'react'

import Form from './Form'
import Options from './Options'
import './index.css'
import Loader from 'react-loader-spinner';
import { usePromiseTracker, trackPromise } from "react-promise-tracker";
import ReactHtmlParser from 'react-html-parser';

//current blue button color: #0366EE

class App extends Component {
  
 constructor(props) {
    super(props);

    this.initialState = {
        questions:  [],
        answers: [],
        answerids: [],
        nodes: [],
        edges:[],
        topsentences: [],
        turn: -1,
        retNbr: 3,
        indriRetNbr: 100,
        nodeThreshold: 0.75,
        edgeThreshold: 0.01,
        convquery: "conv_w1",
        h1: 0.4,
        h2: 0.3,
        h3: 0.2,
        h4: 0.1,
        err: "",
        api_err: "",
        sample: false
                
    };

    this.state = this.initialState;
  }
  
    handleOptionChange = (optionId, value) => {
        this.setState({ [optionId]: value });
    }
    
    validateState = () => {
        
        var errMessage = "";
        if(this.state.retNbr < 1 || this.state.retNbr > 20) {
           errMessage = errMessage +" The number of returned results must lie between 1 and 20!";
        }
        if(this.state.indriRetNbr < 10 || this.state.indriRetNbr > 1000) {
            errMessage = errMessage +" The number of returned Indri passages must lie between 10 and 1000!";
        }
        if(this.state.nodeThreshold < 0.5 || this.state.nodeThreshold > 1.0) {
            errMessage = errMessage +" The node threshold must lie between 0.5 and 1.0!";
        }
        if(this.state.edgeThreshold < 0 || this.state.edgeThreshold > 0.1) {
            errMessage = errMessage +" The edge threshold must lie between 0.0 and 0.1!";
        }
        
        var score = parseFloat(this.state.h1) + parseFloat(this.state.h2) + parseFloat(this.state.h3) + parseFloat(this.state.h4)
        
        var scoreVariance = 0.0001
        
        if(Math.abs(1.0 - score) > scoreVariance ) {
            errMessage = errMessage +" The hyperparameters must sum up to 1.0!";
        }
        
        this.setState({err: errMessage});
        return errMessage;
    }

    
    handleSubmit = question => { 
        this.setState({err: "", api_err: ""});
        var errMessage = this.validateState();
        if(errMessage !== "") {  
            console.log("Abort because of wrong parameters")
            return;
        }
        if(this.state.sample === true) {
             this.setState({questions:  [],answers: [], answerids: [], nodes: [], edges: [], turn: -1, topsentences: [], sample:false}, function () {
                this.callRest(question); 
             });
        }else {
            this.callRest(question);
        }
    }
        
    callRest = question => { 
        
        if (question !== null && question !== "") {
            trackPromise(      
                fetch("/getanswer", {
                     headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json', credentials: 'same-origin'},

                method: 'post', body: JSON.stringify({"questions" : [...this.state.questions,question], 
                                                        "retNbr": this.state.retNbr, "indriRetNbr": this.state.indriRetNbr, 
                                                     "nodeThreshold": this.state.nodeThreshold, "edgeThreshold": this.state.edgeThreshold,
                                                  "convquery": this.state.convquery, "h1": this.state.h1,
                                                    "h2": this.state.h2, "h3": this.state.h3, "h4": this.state.h4})
                  }).then(response => {
                    if (response.ok) {
                      return response.json();
                    } else {
                        console.log("ERROR when calling REST Api, response was:" + response);                   
                    }
                  })
                  .then(data =>this.setState({questions: [...this.state.questions, question],
                       answers:  [...this.state.answers,data["paragraphs"]], answerids:  [...this.state.answerids,data["ids"]], 
                       nodes: [...this.state.nodes, data["nodes"]], edges: [...this.state.edges, data["edges"]], turn: this.state.turn+1, topsentences:  [...this.state.topsentences,data["top_sentences"]], sample: false}

                  ))
                 
                  .catch(error => this.setState({api_err: error }, () => {
                      console.log("ERROR when calling REST Api: " + error);
                     
                })));
        }

    }
 
    
    handleClearConv = () => {    
        this.setState({questions:  [],answers: [], answerids: [], nodes: [], edges: [], turn: -1, topsentences: []})
        
    }
    
    handleClearLastTurn = () => {  
        if(this.state.turn >= 0 && this.state.sample === false) {//since we start at -1
            this.setState({questions:  this.state.questions.slice(0, this.state.questions.length-1) , answers: this.state.answers.slice(0, this.state.answers.length-1), answerids: this.state.answerids.slice(0, this.state.answerids.length-1), nodes: this.state.nodes.slice(0, this.state.nodes.length-1), edges: this.state.edges.slice(0, this.state.edges.length-1), turn: this.state.turn-1, topsentences: this.state.topsentences.slice(0, this.state.questions.length-1)})
        }
    }
    
    handleRestore = () => {
        this.setState({retNbr: 3, indriRetNbr: 100, nodeThreshold: 0.75, edgeThreshold: 0.01, convquery: "conv_w1",
        h1: 0.4,
        h2: 0.3,
        h3: 0.2,
        h4: 0.1})
    }
   


    showSampleAnswers = () => {
        var quest = ["compared to Batman v Superman?", "how was the box office reception?", "and what about harvey dent?", "who played the role of alfred?",  "when did nolan make his batman movies?" ]
        var aw1 = [["With production delays continuing, and the success of The Dark Knight in July 2008, Warner Bros. decided to focus on development of individual films featuring the main heroes, allowing director Christopher Nolan to separately complete his Batman trilogy with The Dark Knight Rises in 2012.", "Gregory Noveck, senior vice president of creative affairs for DC Entertainment stated \"we're going to make a Justice League movie, whether it's now or 10 years from now.", "But we're not going to do it and Warners is not going to do it until we know it's right.\"", "Actor Adam Brody joked \"They [Warner Brothers] just didn't want to cross their streams with a whole bunch of Batmans in the universe.\"", "Warner Bros. relaunched development for the solo Green Lantern film, released in 2011 as a critical and financial disappointment.", "Meanwhile, film adaptations for the The Flash and Wonder Woman continued to languish in development while filming for a Superman reboot was commencing in 2011 with Man of Steel, produced by Nolan and written by Batman screenwriter David S. Goyer.", "Shortly after filming had finished for Man of Steel, Warner Bros hired Will Beall to script a new Justice League film.", "Warner Bros. president Jeff Robinov explained that Man of Steel would be \"setting the tone for what the movies are going to be like going forward.", "In that, it's definitely a first step.\"", "The film included references to the existence of other superheroes in the DC Universe, and setting the tone for a shared fictional universe of DC Comics characters on film.", "Goyer stated should Green Lantern appear in a future installment, that it would be a rebooted version of the character and not connected to the 2011 film.", "With the release of Man of Steel in June 2013, Goyer was hired to write a sequel, as well as a new Justice League, with the Beall draft being scrapped.", "The sequel was later revealed to be Batman v Superman: Dawn of Justice, a team up film featuring Ben Affleck as Batman, Gal Gadot as Wonder Woman, and Ray Fisher as Victor Stone / Cyborg in a minor role that will become more significant in leading up to the proposed Justice League film.", "The universe is separate from Nolan and Goyer's work on The Dark Knight trilogy, although Nolan is still involved as an executive producer for Batman v Superman.", "In April 2014, it was announced that Zack Snyder would also be directing Goyer's Justice League script.", "Warner Bros. was reportedly courting Chris Terrio to rewrite Justice League the following July, after having been impressed with his rewrite of Batman v Superman: Dawn of Justice.", "On October 15, 2014, Warner Bros. announced the film would be released in two parts, with Part One releasing on November 17, 2017, and Part Two on June 14, 2019.", "Snyder will direct both films.", "In early July 2015, EW revealed that the script for Justice League Part One had been completed by Terrio.", "Zack Snyder stated that the film will be inspired by the New Gods comic series by Jack Kirby.", "Although Justice League was initially announced as a two-part film with the second part releasing two years after the first, Snyder announced in June 2016 that they would be two distinct, separate films and not one film split into two parts, both being stand-alone stories." 
], ["Nolan wanted the story for the third and final installment to keep him emotionally invested.\"", "On a more superficial level, I have to ask the question,\" he reasoned, \"how many good third movies in a franchise can people name?\"", "He returned out of finding a necessary way to continue the story, but feared midway through filming he would find a sequel redundant.", "The Dark Knight Rises is intended to complete Nolan's Batman trilogy.", "By December 2008, Nolan completed a rough story outline, before he committed himself to Inception.", "In February 2010, work on the screenplay was commencing with David S. Goyer and Jonathan Nolan.", "When Goyer left to work on the Superman reboot, Jonathan was writing the script based on the story by his brother and Goyer.", "Tom Hardy was cast as Bane and Anne Hathaway plays Selina Kyle.", "Joseph Gordon-Levitt was cast as John Blake, and Marion Cotillard was cast as Miranda Tate.", "Filming began in May 2011 and concluded in November.", "Nolan chose not to film in 3-D but, by focusing on improving image quality and scale using the IMAX format, hoped to push technological boundaries while nevertheless making the style of the film consistent with the previous two.", "Nolan had several meetings with IMAX Vice-President David Keighley to work on the logistics of projecting films in digital IMAX venues.", "The Dark Knight Rises featured more scenes shot in IMAX than The Dark Knight.", "Cinematographer Wally Pfister expressed interest in shooting the film entirely in IMAX.", "During the film, set eight years after Dark Knight, the arrival of new foe Bane forces Bruce to return to his old role as Batman, only to find himself overpowered and captured by Bane as Gotham is cut off from the rest of the world with a stolen Wayne Enterprises fusion generator prototype set to go off in a few months.", "With the aid of thief Selina Kyle, Bruce is able to return to Gotham and defeat Bane while redeeming his image as Batman.", "The film concludes with Bruce having 'retired' as Batman after faking his death to live with Selina Kyle, evidence suggesting that he has passed on the Batcave to new ally Detective John Blake (real first name Robin) while Gotham rebuilds in memory of the Dark Knight's heroism." ],
["The Dark Knight Rises was filmed in Los Angeles, CA, New York, NY, London, UK, and Pittsburgh, PA.", "Unlike the first two installments of Christopher Nolan's Batman trilogy, Batman Begins and The Dark Knight, which were filmed in Chicago, The Dark Knight Rises was primarily filmed in Pittsburgh.Zoom to: Los Angeles, CA, New York, NY, London, UK, Pittsburgh, PA.nlike the first two installments of Christopher Nolan's Batman trilogy, Batman Begins and The Dark Knight, which were filmed in Chicago, The Dark Knight Rises was primarily filmed in Pittsburgh.", "Zoom to: Los Angeles, CA, New York, NY, London, UK, Pittsburgh, PA."]]    
   var aw2 = [["The Dark Knight Rises is a 2012 superhero film directed by Christopher Nolan, who co-wrote the screenplay with his brother Jonathan Nolan, and the story with David S. Goyer.", "Featuring the DC Comics character Batman, the film is the final installment in Nolan's Batman film trilogy, and the sequel to Batman Begins (2005) and The Dark Knight (2008).", "Christian Bale reprises the lead role of Bruce Wayne/Batman, with a returning cast of allies: Michael Caine as Alfred Pennyworth, Gary Oldman as James Gordon, and Morgan Freeman as Lucius Fox.", "The film introduces Selina Kyle (Anne Hathaway), and Bane (Tom Hardy).", "Eight years after the events of The Dark Knight, merciless revolutionary Bane forces an older Bruce Wayne to resume his role as Batman and save Gotham City from nuclear destruction."], 
       ["With production delays continuing, and the success of The Dark Knight in July 2008, Warner Bros. decided to focus on development of individual films featuring the main heroes, allowing director Christopher Nolan to separately complete his Batman trilogy with The Dark Knight Rises in 2012.", "Gregory Noveck, senior vice president of creative affairs for DC Entertainment stated \"we're going to make a Justice League movie, whether it's now or 10 years from now.", "But we're not going to do it and Warners is not going to do it until we know it's right.\"", "Actor Adam Brody joked \"They [Warner Brothers] just didn't want to cross their streams with a whole bunch of Batmans in the universe.\"", "Warner Bros. relaunched development for the solo Green Lantern film, released in 2011 as a critical and financial disappointment.", "Meanwhile, film adaptations for the The Flash and Wonder Woman continued to languish in development while filming for a Superman reboot was commencing in 2011 with Man of Steel, produced by Nolan and written by Batman screenwriter David S. Goyer.", "Shortly after filming had finished for Man of Steel, Warner Bros hired Will Beall to script a new Justice League film.", "Warner Bros. president Jeff Robinov explained that Man of Steel would be \"setting the tone for what the movies are going to be like going forward.", "In that, it's definitely a first step.\"", "The film included references to the existence of other superheroes in the DC Universe, and setting the tone for a shared fictional universe of DC Comics characters on film.", "Goyer stated should Green Lantern appear in a future installment, that it would be a rebooted version of the character and not connected to the 2011 film.", "With the release of Man of Steel in June 2013, Goyer was hired to write a sequel, as well as a new Justice League, with the Beall draft being scrapped.", "The sequel was later revealed to be Batman v Superman: Dawn of Justice, a team up film featuring Ben Affleck as Batman, Gal Gadot as Wonder Woman, and Ray Fisher as Victor Stone / Cyborg in a minor role that will become more significant in leading up to the proposed Justice League film.", "The universe is separate from Nolan and Goyer's work on The Dark Knight trilogy, although Nolan is still involved as an executive producer for Batman v Superman.", "In April 2014, it was announced that Zack Snyder would also be directing Goyer's Justice League script.", "Warner Bros. was reportedly courting Chris Terrio to rewrite Justice League the following July, after having been impressed with his rewrite of Batman v Superman: Dawn of Justice.", "On October 15, 2014, Warner Bros. announced the film would be released in two parts, with Part One releasing on November 17, 2017, and Part Two on June 14, 2019.", "Snyder will direct both films.", "In early July 2015, EW revealed that the script for Justice League Part One had been completed by Terrio.", "Zack Snyder stated that the film will be inspired by the New Gods comic series by Jack Kirby.", "Although Justice League was initially announced as a two-part film with the second part releasing two years after the first, Snyder announced in June 2016 that they would be two distinct, separate films and not one film split into two parts, both being stand-alone stories." 
], ["The film is set in the universe of the Batman: Arkham video game franchise, occurring after Arkham Origins, though Jay Oliva states it takes place about two years before Arkham Asylum." ,"The story focuses primarily on the Suicide Squad, particularly Batman villains Deadshot and Harley Quinn with Batman in a supporting role." ,"In the film, a Suicide Squad of six criminals is dispatched by Amanda Waller to break into Arkham Asylum, where they must contend with the asylum's inmates and Batman as they attempt to complete their mission." ," The film stars Kevin Conroy as Batman/Bruce Wayne (reprising his role as Batman from the DC Animated Universe, among other numerous DC properties, including the Arkham series), Neal McDonough as Deadshot/Floyd Lawton, Hynden Walch as Harley Quinn/Dr." , "Harleen Quinzel (who reprises her role from The Batman) and Matthew Gray Gubler as Riddler/Edward Nygma." , "In addition, Troy Baker, C.C.H. Pounder, Nolan North, and Martin Jarvis reprise their roles of Joker, Amanda Waller, Penguin/Oswald Cobblepot and Alfred Pennyworth from Arkham Origins (with North and Jarvis also appearing in Arkham City), while Jennifer Hale reprises her role of Killer Frost from the DCAU and other properties."]]
        var aw3 = [["According to Nolan, an important theme of the sequel is \"escalation,\" extending the ending of Batman Begins, noting \"things having to get worse before they get better.\"" ,"While indicating The Dark Knight would continue the themes of Batman Begins, including justice vs. revenge and Bruce Wayne's issues with his father, Nolan emphasized the sequel would also portray Wayne more as a detective, an aspect of his character not fully developed in Batman Begins." , "Nolan described the friendly rivalry between Bruce Wayne and Harvey Dent as the \"backbone\" of the film." , "He also chose to compress the overall storyline, allowing Dent to become Two-Face in The Dark Knight, thus giving the film an emotional arc the unsympathetic Joker could not offer." , "Nolan acknowledged the title was not only a reference to Batman, but also the fallen \"white knight\" Harvey Dent."], 
            ["In the Batman story arc Batman: Face the Face, that started in Detective Comics #817, and was part of DC's One Year Later storyline, it is revealed that, at Batman's request and with his training, Harvey Dent becomes a vigilante protector of Gotham City in most of Batman's absence of nearly a year." , "He is reluctant to take the job, but Batman assures him it would serve as atonement for his past crimes." , "After a month of training, they fight Firebug and Mr. Freeze, before Batman leaves for a year." , "Dent enjoys his new role, but his methods are seemingly more extreme and less refined than Batman's." , "Upon Batman's return, Dent begins to feel unnecessary and unappreciated, which prompts the return of the \"Two-Face\" persona (seen and heard by Dent through hallucinations)." , "In Face the Face, his frustration is compounded by a series of mysterious murders that seem to have been committed by Two-Face; the villains KGBeast, Magpie, the Ventriloquist, and Orca are all shot twice in the head with a double-barreled pistol." , "When Batman confronts Dent about these deaths, asking him to confirm that he was not responsible, Dent refuses to give a definite answer." , "He then detonates a bomb in his apartment and leaves Batman dazed as he flees."], 
            ["Christopher Nolan reprised his duties as director, and brought his brother, Jonathan, to co-write the script for the second installment." , "The Dark Knight featured Christian Bale reprising his role as Batman/Bruce Wayne, Heath Ledger as The Joker, and Aaron Eckhart as Harvey Dent / Two-Face." ,"Principal photography began in April 2007 in Chicago and concluded in November." , "Other locations included Pinewood Studios, Ministry of Sound in London and Hong Kong." , "On January 22, 2008, after he had completed filming The Dark Knight, Ledger died from a bad combination of prescription medication." , "Warner Bros. had created a viral marketing campaign for The Dark Knight, developing promotional websites and trailers highlighting screen shots of Ledger as the Joker, but after Ledger's death, the studio refocused its promotional campaign." , "The film depicts Gotham attempting to rebuild after Batman's actions have caused so much damage to its organised crime families, aided by the prosecution of charismatic District Attorney Harvey Dent, but the involvement of the anarchic Joker threatens everything, as his actions lead to the death of Rachel Dawes and Harvey being scarred and transformed into Two-Face." , "Although Batman is able to stop the Joker from forcing two ferries- one loaded with civilians and the other with prisoners- to destroy each other, he is forced to take the blame for the murders committed by Dent to ensure that the city retains its hope for the future."]]
        var aw4 = [["According to Nolan, an important theme of the sequel is \"escalation,\" extending the ending of Batman Begins, noting \"things having to get worse before they get better.\"" ,"While indicating The Dark Knight would continue the themes of Batman Begins, including justice vs. revenge and Bruce Wayne's issues with his father, Nolan emphasized the sequel would also portray Wayne more as a detective, an aspect of his character not fully developed in Batman Begins." , "Nolan described the friendly rivalry between Bruce Wayne and Harvey Dent as the \"backbone\" of the film." , "He also chose to compress the overall storyline, allowing Dent to become Two-Face in The Dark Knight, thus giving the film an emotional arc the unsympathetic Joker could not offer." , "Nolan acknowledged the title was not only a reference to Batman, but also the fallen \"white knight\" Harvey Dent."], 
            ["In the weeks leading up to the film's release, advance ticket sales outpaced The Dark Knight Rises, The Avengers, and Furious 7.", "Worldwide, it was estimated to gross between $300–340 million in over 35,000 screens in its opening weekend.", "It passed the $50 million mark in IMAX ticket sales on its second weekend, grossing a total of $53.4 million from 571 IMAX screens.", "Warner Bros. domestic distribution chief Jeff Goldstein described the film's box office performance as a \"fantastic result, by any measure.\"", "Box office analyst Jeff Bock said \"Still, outside of Christopher Nolan's two Dark Knight movies, and Tim Burton's Batman films when you adjust for inflation, this is the highest-grossing property in DC's bullpen thus far.", "It tops Man of Steel by more than $200 million,\" and that \"overall, BvS successfully relaunched DC's cinematic universe, but they are nowhere near Disney/Marvel in terms of critical reception and box office prowess.", "\"One can only hope that bigger and better is still on the way.\"", "The film needed to reach $800 million in revenue at the box office to \"recoup its investment\" according to financial analysts.", "Despite surpassing this amount, it was considered \"a disappointment\" for failing to reach $1 billion, This resulted in Warner Bros., in May 2016, creating DC Films, giving a dedicated executive team responsibility for films based on DC Comics, similar to the dedicated Marvel Comics focus of Marvel Studios within the larger Walt Disney Studios group.", "Batman v Superman: Dawn of Justice grossed $330.4 million in North America and $542.9 million in other territories for a worldwide total of $873.3 million, making it the sixth highest-grossing film of 2016 behind Captain America: Civil War, Finding Dory, Zootopia, The Jungle Book, and The Secret Life of Pets."],
           ["Also in 2008, Eckhart portrayed the comic book character Harvey Dent in Christopher Nolan's The Dark Knight, the sequel to the 2005 film Batman Begins." , "Nolan's decision to cast Eckhart was based on his portrayal of corrupt characters in the films In the Company of Men, The Black Dahlia, and Thank You For Smoking." , "He noted in his depiction of the character that \"[he] is still true to himself." , "He's a crime fighter, he's not killing good people." , "He's not a bad guy, not purely\", while admitting \"I'm interested in good guys gone wrong.\"", "The Dark Knight was a big financial and critical success, setting a new opening weekend box office record for North America." , "With revenue of $1 billion worldwide, it became the fourth highest-grossing film of all time, and the highest-grossing film of Eckhart's career." , "Roger Ebert opined that Eckhart did an \"especially good job\" as his character in the feature, while Premiere magazine also enjoyed his performance, noting that he \"makes you believe in his ill-fated ambition ... of morphing into the conniving Two-Face.\""]]
        var aw5 = [["With production delays continuing, and the success of The Dark Knight in July 2008, Warner Bros. decided to focus on development of individual films featuring the main heroes, allowing director Christopher Nolan to separately complete his Batman trilogy with The Dark Knight Rises in 2012.", "Gregory Noveck, senior vice president of creative affairs for DC Entertainment stated \"we're going to make a Justice League movie, whether it's now or 10 years from now.", "But we're not going to do it and Warners is not going to do it until we know it's right.\"", "Actor Adam Brody joked \"They [Warner Brothers] just didn't want to cross their streams with a whole bunch of Batmans in the universe.\"", "Warner Bros. relaunched development for the solo Green Lantern film, released in 2011 as a critical and financial disappointment.", "Meanwhile, film adaptations for the The Flash and Wonder Woman continued to languish in development while filming for a Superman reboot was commencing in 2011 with Man of Steel, produced by Nolan and written by Batman screenwriter David S. Goyer.", "Shortly after filming had finished for Man of Steel, Warner Bros hired Will Beall to script a new Justice League film.", "Warner Bros. president Jeff Robinov explained that Man of Steel would be \"setting the tone for what the movies are going to be like going forward.", "In that, it's definitely a first step.\"", "The film included references to the existence of other superheroes in the DC Universe, and setting the tone for a shared fictional universe of DC Comics characters on film.", "Goyer stated should Green Lantern appear in a future installment, that it would be a rebooted version of the character and not connected to the 2011 film.", "With the release of Man of Steel in June 2013, Goyer was hired to write a sequel, as well as a new Justice League, with the Beall draft being scrapped.", "The sequel was later revealed to be Batman v Superman: Dawn of Justice, a team up film featuring Ben Affleck as Batman, Gal Gadot as Wonder Woman, and Ray Fisher as Victor Stone / Cyborg in a minor role that will become more significant in leading up to the proposed Justice League film.", "The universe is separate from Nolan and Goyer's work on The Dark Knight trilogy, although Nolan is still involved as an executive producer for Batman v Superman.", "In April 2014, it was announced that Zack Snyder would also be directing Goyer's Justice League script.", "Warner Bros. was reportedly courting Chris Terrio to rewrite Justice League the following July, after having been impressed with his rewrite of Batman v Superman: Dawn of Justice.", "On October 15, 2014, Warner Bros. announced the film would be released in two parts, with Part One releasing on November 17, 2017, and Part Two on June 14, 2019.", "Snyder will direct both films.", "In early July 2015, EW revealed that the script for Justice League Part One had been completed by Terrio.", "Zack Snyder stated that the film will be inspired by the New Gods comic series by Jack Kirby.", "Although Justice League was initially announced as a two-part film with the second part releasing two years after the first, Snyder announced in June 2016 that they would be two distinct, separate films and not one film split into two parts, both being stand-alone stories." 
],["In the weeks leading up to the film's release, advance ticket sales outpaced The Dark Knight Rises, The Avengers, and Furious 7.", "Worldwide, it was estimated to gross between $300–340 million in over 35,000 screens in its opening weekend.", "It passed the $50 million mark in IMAX ticket sales on its second weekend, grossing a total of $53.4 million from 571 IMAX screens.", "Warner Bros. domestic distribution chief Jeff Goldstein described the film's box office performance as a \"fantastic result, by any measure.\"", "Box office analyst Jeff Bock said \"Still, outside of Christopher Nolan's two Dark Knight movies, and Tim Burton's Batman films when you adjust for inflation, this is the highest-grossing property in DC's bullpen thus far.", "It tops Man of Steel by more than $200 million,\" and that \"overall, BvS successfully relaunched DC's cinematic universe, but they are nowhere near Disney/Marvel in terms of critical reception and box office prowess.", "\"One can only hope that bigger and better is still on the way.\"", "The film needed to reach $800 million in revenue at the box office to \"recoup its investment\" according to financial analysts.", "Despite surpassing this amount, it was considered \"a disappointment\" for failing to reach $1 billion, This resulted in Warner Bros., in May 2016, creating DC Films, giving a dedicated executive team responsibility for films based on DC Comics, similar to the dedicated Marvel Comics focus of Marvel Studios within the larger Walt Disney Studios group.", "Batman v Superman: Dawn of Justice grossed $330.4 million in North America and $542.9 million in other territories for a worldwide total of $873.3 million, making it the sixth highest-grossing film of 2016 behind Captain America: Civil War, Finding Dory, Zootopia, The Jungle Book, and The Secret Life of Pets."],
           ["Batman vs Superman movie named Batman v Superman: Dawn of Justice.It's official: Batman will get more screentime than Superman in Batman v Superman: Dawn of Justice.", "9 unanswered questions from Batman v Superman: Dawn of Justice, from bad Batman dreams to Lex Luthor's master plan." , "Ben Affleck apparently contributed to the Batman v Superman: Dawn of Justice script..."]]


        
        //var aw2 = ["Christian Bale, Michael Caine and Cillian Murphy have been frequent collaborators since Batman Begins.Caine is Nolan's most prolific collaborator, having appeared in six of his films, and is regarded by Nolan to be his \"good luck charm\".In return, Caine has described Nolan as \"one of cinema's greatest directors\", comparing him favorably with the likes of David Lean, John Huston and Joseph L. Mankiewicz.Nolan is also known for casting stars from the 1980s in his films, i.e. Rutger Hauer (Batman Begins), Eric Roberts (The Dark Knight), Tom Berenger (Inception), and Matthew Modine (The Dark Knight Rises).Modine said of working with Nolan: \"There are no chairs on a Nolan set, he gets out of his car and goes to the set.And he stands up until lunchtime.And then he stands up until they say \'Wrap\'.He\'s fully engaged – in every aspect of the film.\"",
          //  "With production delays continuing, and the success of The Dark Knight in July 2008, Warner Bros. decided to focus on development of individual films featuring the main heroes, allowing director Christopher Nolan to separately complete his Batman trilogy with The Dark Knight Rises in 2012.Gregory Noveck, senior vice president of creative affairs for DC Entertainment stated \"we're going to make a Justice League movie, whether it's now or 10 years from now.But we're not going to do it and Warners is not going to do it until we know it's right.\"Actor Adam Brody joked \"They [Warner Brothers] just didn't want to cross their streams with a whole bunch of Batmans in the universe.\"Warner Bros. relaunched development for the solo Green Lantern film, released in 2011 as a critical and financial disappointment.Meanwhile, film adaptations for the The Flash and Wonder Woman continued to languish in development while filming for a Superman reboot was commencing in 2011 with Man of Steel, produced by Nolan and written by Batman screenwriter David S. Goyer.Shortly after filming had finished for Man of Steel, Warner Bros hired Will Beall to script a new Justice League film.Warner Bros. president Jeff Robinov explained that Man of Steel would be \"setting the tone for what the movies are going to be like going forward.In that, it's definitely a first step.\"The film included references to the existence of other superheroes in the DC Universe, and setting the tone for a shared fictional universe of DC Comics characters on film.Goyer stated should Green Lantern appear in a future installment, that it would be a rebooted version of the character and not connected to the 2011 film.With the release of Man of Steel in June 2013, Goyer was hired to write a sequel, as well as a new Justice League, with the Beall draft being scrapped.The sequel was later revealed to be Batman v Superman: Dawn of Justice, a team up film featuring Ben Affleck as Batman, Gal Gadot as Wonder Woman, and Ray Fisher as Victor Stone / Cyborg in a minor role that will become more significant in leading up to the proposed Justice League film.The universe is separate from Nolan and Goyer's work on The Dark Knight trilogy, although Nolan is still involved as an executive producer for Batman v Superman.In April 2014, it was announced that Zack Snyder would also be directing Goyer's Justice League script.Warner Bros. was reportedly courting Chris Terrio to rewrite Justice League the following July, after having been impressed with his rewrite of Batman v Superman: Dawn of Justice.On October 15, 2014, Warner Bros. announced the film would be released in two parts, with Part One releasing on November 17, 2017, and Part Two on June 14, 2019.Snyder will direct both films.In early July 2015, EW revealed that the script for Justice League Part One had been completed by Terrio.Zack Snyder stated that the film will be inspired by the New Gods comic series by Jack Kirby.Although Justice League was initially announced as a two-part film with the second part releasing two years after the first, Snyder announced in June 2016 that they would be two distinct, separate films and not one film split into two parts, both being stand-alone stories.",
            //"However, Nolan absolutely deserves credit for delivering the best Batman movies that anyone has made to date.The Dark Knight Trilogy was impeccably well cast, starting with Christian Bale as Bruce Wayne/Batman; along with Michael Caine as Alfred, Gary Oldman as Jim Gordon, and Morgan Freeman as Lucius Fox."]
      //  var aw3 = ["The Dark Knight is a 2008 superhero thriller film directed, produced, and co-written by Christopher Nolan.Featuring the DC Comics character Batman, the film is the second part of Nolan's The Dark Knight Trilogy and a sequel to 2005's Batman Begins, starring an ensemble cast including Christian Bale, Michael Caine, Heath Ledger, Gary Oldman, Aaron Eckhart, Maggie Gyllenhaal and Morgan Freeman.In the film, Bruce Wayne/Batman (Bale), James Gordon (Oldman) and Harvey Dent (Eckhart) form an alliance to dismantle organised crime in Gotham City, but are menaced by a criminal mastermind known as the Joker (Ledger) who seeks to undermine Batman's influence and create chaos.",
        //    "Now hunted by the police, Batman must discover who is behind the frame up and how everything that has occurred since Joker's disappearance factor in together.He ultimately heads back to Funnibones Warehouse disguised for more information, only to discover the knife that the Joker was holding the night he fell from the bridge; the Joker is not dead after all.Joker reveals that he was behind the entire crime wave that occurred after faking his death by subtly manipulating the other villains and using Isaac Evers' research, having worked with the scientist and funded all his experiments and operations through his ill conceived fortune, to produce large quantities of the highly flammable Promethium.Weeks earlier, Joker had arranged the fake kidnapping scheme to fake his own death in order to reside in the shadows and out of the police and Batman's scope while he manipulated the other villains; he sent Mr. Freeze the promotional tape on Promethium to provoke him into attacking Isaac's lair so his men could convince Evers to hire their services in an insurance scam with the use of Gotham Gasworks, provided Poison Ivy with the plant enhancement chemical and used her schemes to rebuild Gotham Chemical to mass-produce his own signature Joker toxin in a quiet fashion without Batman suspecting his true plans, and finally used Harley to relay false information to Batman to send him deeper into his plot at the Gasworks and ultimately frame him for attacking Commissioner Gordon.Using Evers as a scapegoat for the Gasworks scheme, Joker reveals that he used Batman to open up the pipes to the sprinkler system, which Joker then plans to use to pump in his Joker toxin, mixed with Evers' drug, all over the city through a feed tube connected to the previously stolen blimp, now filled with the deadly compound, and burn the city to the ground while its citizen choke to death on their own laughter.The motive of the entire scheme is that Gotham would be completely destroyed with the punchline being that Batman had been unknowingly aiding in the scheme due to Joker's manipulation.Joker then prepares to escape in the blimp and watch Gotham from above become engulf in flames and toxin, leaving groups of his men, armed with explosives and flamethrowers, to slow the hero down.Despite this, Batman manages to shut down the gas flow and defeat all of Joker's thugs in time to get on the Joker's blimp.Despite having stopped the flow of Promethium and Joker toxin into the sprinkler system, Joker plans to use the remaining compound stored in the blimp to destroy Gotham by setting the blimp on a collision course with City Hall to release it all into the air. After a brief fight with the Joker, Batman knocks the villain out, deteriorates the gas, and disables the auto-pilot.Deciding to play one last, twisted joke on Batman once he realizes his plans have failed, Joker jumps from the blimp to entice Batman to save him and have a final showdown with the hero while plummeting down to Gotham.Batman manages to both defeat and save the Joker and destroys the blimp, finally taking his archenemy back to Arkham Asylum.",
       //     "Based on the DC Comics character Batman, the film is the second part of Nolan's Batman film series and a sequel to 2005's Batman Begins, starring Christian Bale, Michael Caine, Heath Ledger, Gary Oldman, Aaron Eckhart, Maggie Gylenhaal and Morgan Freeman.he Dark Knight was filmed primarily in Chicago, as well as in several other locations in the United States, the United Kingdom, and Hong Kong.Nolan used IMAX 70 mm film cameras to film some sequences, including the Joker's first appearance in the film."]
       // var aw4 = ["After much research, Nolan's brother and co-writer, Jonathan, suggested the Joker's first two appearances, published in the first issue of Batman (1940), as the crucial influences.Christopher had Jonathan watch Fritz Lang's 1933 crime film The Testament of Dr. Mabuse prior to writing the Joker, with the Joker resembling Mabuse's characteristics.Christopher Nolan referred to Lang's film as \"essential research for anyone attempting to write a supervillain.\"Jerry Robinson, one of the Joker's co-creators, was consulted on the character's portrayal.Nolan decided to avoid divulging an in-depth origin story for the Joker, and instead portray his rise to power so as to not diminish the threat he poses, explaining to MTV News, \"the Joker we meet in The Dark Knight is fully formed...To me, the Joker is an absolute.There are no shades of gray to him – maybe shades of purple.He's unbelievably dark.He bursts in just as he did in the comics.\"Nolan reiterated to IGN, \"We never wanted to do an origin story for the Joker in this film,\" because \"the arc of the story is much more Harvey Dent's; the Joker is presented as an absolute.It's a very thrilling element in the film, and a very important element, but we wanted to deal with the rise of the Joker, not the origin of the Joker.\"Nolan suggested Batman: The Killing Joke influenced a section of the Joker's dialogue in the film, in which he says that anyone can become like him given the right circumstances.Nolan also cited Heat as \"sort of an inspiration\" for his aim \"to tell a very large, city story or the story of a city\": \"If you want to take on Gotham, you want to give Gotham a kind of weight and breadth and depth in there.So you wind up dealing with the political figures, the media figures.That\'s part of the whole fabric of how a city is bound together.\"",
      //      " During the filming of Batman & Robin, Warner Bros. was impressed with the dailies, prompting them to immediately hire Joel Schumacher to reprise his directing duties for a third film.Writer Akiva Goldsman, who worked on Batman Forever and Batman & Robin, turned down the chance to write the script.In late 1996, Warner Bros. and Schumacher hired Mark Protosevich to write the script for a fifth Batman film.A projected mid-1999 release date was announced.Titled Batman Unchained but often incorrectly referred to as Batman Triumphant, Protosevich's script had the Scarecrow as the main villain and the Joker would return as a hallucination in Batman's mind caused by the Scarecrow's fear toxin.Harley Quinn appeared as a supporting character, written as the Joker's daughter trying to kill Batman to avenge her father's death.George Clooney, Chris O'Donnell and Alicia Silverstone were set to reprise the roles of Batman, Robin, and Batgirl.Schumacher had also approached Nicolas Cage for the role of Scarecrow.However, when Batman & Robin received negative reviews and failed to outgross any of its predecessors, Warner Bros. was unsure of their plans for Batman Unchained.The studio decided it was best to consider a live-action Batman Beyond film and an adaptation of Frank Miller's Batman: Year One.Warner Bros. would then greenlight whichever idea suited them the most.Schumacher felt he \"owe[d] the Batman culture a real Batman movie.I would go back to the basics and make a dark portrayal of the Dark Knight.\"He approached Warner Bros. to do Batman: Year One in mid-1998.",
      //      "Before the release of Batman Begins, screenwriter David S. Goyer wrote a treatment for two sequels which introduced the Joker and Harvey Dent.His original intent was for the Joker to scar Dent during the Joker\'s trial in the third film, turning Dent into Two-Face.Goyer, who penned the first draft of the film, cited the DC Comics 13-issue comic book limited series Batman: The Long Halloween as the major influence on his storyline.According to veteran Batman artist Neal Adams, he met with David Goyer in Los Angeles, and the story would eventually look to Adams and writer Denny O\'Neil\'s 1971 story \"The Joker\'s Five-Way Revenge\" that appeared in Batman #251, in which O\'Neil and Adams re-introduced the Joker.While initially uncertain of whether or not he would return to direct the sequel, Nolan did want to reinterpret the Joker on screen.On July 31, 2006, Warner Bros. officially announced initiation of production for the sequel to Batman Begins titled The Dark Knight; it is the first live-action Batman film without the word \"Batman\" in its title, which Bale noted as signaling that \"this take on Batman of mine and Chris\' is very different from any of the others.\""]
       // var aw5 = ["In the weeks leading up to the film's release, advance ticket sales outpaced The Dark Knight Rises, The Avengers, and Furious 7.Worldwide, it was estimated to gross between $300–340 million in over 35,000 screens in its opening weekend.It passed the $50 million mark in IMAX ticket sales on its second weekend, grossing a total of $53.4 million from 571 IMAX screens.Warner Bros. domestic distribution chief Jeff Goldstein described the film's box office performance as a \"fantastic result, by any measure.\"Box office analyst Jeff Bock said \"Still, outside of Christopher Nolan's two Dark Knight movies, and Tim Burton's Batman films when you adjust for inflation, this is the highest-grossing property in DC's bullpen thus far.It tops Man of Steel by more than $200 million,\" and that \"overall, BvS successfully relaunched DC's cinematic universe, but they are nowhere near Disney/Marvel in terms of critical reception and box office prowess.One can only hope that bigger and better is still on the way.\"The film needed to reach $800 million in revenue at the box office to \"recoup its investment\" according to financial analysts.Despite surpassing this amount, it was considered \"a disappointment\" for failing to reach $1 billion, This resulted in Warner Bros., in May 2016, creating DC Films, giving a dedicated executive team responsibility for films based on DC Comics, similar to the dedicated Marvel Comics focus of Marvel Studios within the larger Walt Disney Studios group.Batman v Superman: Dawn of Justice grossed $330.4 million in North America and $542.9 million in other territories for a worldwide total of $873.3 million, making it the sixth highest-grossing film of 2016 behind Captain America: Civil War, Finding Dory, Zootopia, The Jungle Book, and The Secret Life of Pets.",
        //    "Sometime between the events of Batman: Arkham Origins and Batman: Arkham Asylum, street orphan Jason Todd was taken in by the crime-fighter Batman, and trained in all forms of combat as the second Robin after Dick Grayson's departure.However, Jason was captured by the Joker, and a video was sent to the Dark Knight of Jason's apparent death.But the Joker lied about killing Jason, and was revealed to have held him in an abandoned wing of Arkham Asylum for over a year, torturing him and breaking his sanity.After the Joker showed Jason a picture of Batman with Tim Drake as the third Robin, Jason snapped and found himself resenting his former mentor more than anything else.Succeeding in making Jason hate his nemesis, the Joker set him free, allowing Todd to start planning his revenge on Batman for leaving him.Jason utilized advanced technology to develop a high-tech militaristic battle-suit and equipment, forming his own army of personally trained soldiers in Venezuela.Todd soon adopted the identity of the “Arkham Knight", a ruthless supervillain and militia leader.Years later, after the Joker's death in Batman: Arkham City, there was a power vacuum in Gotham City's criminal underworld.When crime rates plummeted without the Clown Prince of Crime's iron grip over the city's criminals, the Arkham Knight appeared in Gotham, forging an alliance with the Scarecrow.Together, the two united all of Gotham's masterminds, crime lords, thugs, thieves and gangsters in an attempt to rid themselves of the Dark Knight once and for all.Scarecrow forced Gotham's inhabitants to evacuate with his newest strain of fear toxin, allowing the Arkham Knight's militia to take complete control over the city.In the beginning of the game, the Arkham Knight and his militia provide an escort for Scarecrow at ACE Chemicals, preventing Batman and the police from foiling their plans of covering the entire eastern seaboard with fear gas.When Batman arrives, the Arkham Knight tries to kill him with his chopper, only to be stopped by the Scarecrow (who wanted the Dark Knight to suffer first).Eventually, Batman reduced the chain reaction in the central mixing chamber, stopping the fear gas from being released.The Arkham Knight then kidnaps Oracle from her clock tower and holds her hostage.When Batman tracks Oracle to a militia facility, the Arkham Knight corners and shoots Batman in the chest before leaving the scene.The villain later assists Scarecrow in escaping Simon Stagg's airship with the fear toxin dispersing machine, \"the Cloudburst\".The Arkham Knight then attaches the Cloudburst to his personal tank and battles Batman in the Batmobile, only for the hero to destroy the device.When Batman breaks into the militia's primary headquarters, the Arkham Knight confronts him in the excavator tunnels with a mining vehicle.Although the Arkham Knight destroys the Batmobile, Batman manages to escape.Jason eventually reveals himself to Batman as the hero attempts to save Commissioner Gordon.During the confrontation, Batman damages the Arkham Knight's visor, prompting Jason to discard it and reveal a red domed helmet underneath.After defeating Jason, Batman offers to help his former partner recover, but Jason states that it is too late to help him and vanishes.At the end of the game, Jason prevents Scarecrow from executing Batman after the latter is publicly exposed as Bruce Wayne.Jason later adopts the \"Red Hood\" persona, and becomes a murderous vigilante with extreme measures, such as the use of guns and lethal force.He wears the same red helmet that he had at the end of the game's main story, but now sports a white leather jacket and a Red Hood symbol painted on his chest.As Red Hood, he has a DLC storyline in which he hunts down and kills the crime lord Black Mask.",
        //    "After Christopher Nolan's successful 2005 Batman film reboot, Batman Begins, which ended with a teaser for the Joker's involvement in a sequel, the character appeared in 2008's The Dark Knight, played by Heath Ledger as an avatar of anarchy and chaos.While Batman Begins earned a worldwide total of $370 million; The Dark Knight earned over $1 billion and was the highest-grossing film of the year, setting several box-office records (including highest-grossing midnight opening, opening day and opening weekend).Ledger won a posthumous Academy Award for Best Supporting Actor for his performance, the first acting Oscar ever won for a superhero film.The Joker has featured in a number of animated projects, such as 2009's Batman: The Brave and the Bold (voiced by Jeff Bennett) and 2011's Young Justice (voiced by Brent Spiner), and comic book adaptations (including 2010's Batman: Under the Red Hood, in which he is voiced by John DiMaggio).In 2012, Michael Emerson voiced the character in a two-part animated adaptation of The Dark Knight Returns.The Joker appears in the 2016 film Suicide Squad, portrayed by Jared Leto."]
        
        var ids1 = ["CAR_f327e39cd2d17863ebd8923a228583374deff08e", "CAR_03303ef055dddb743a91a340e2c18c0e841c818e", "MARCO_4722980"]
        var ids2 = ["CAR_815d1f6d811c8060b2d0f58eb12ef7359afb1162", "CAR_f327e39cd2d17863ebd8923a228583374deff08e", "CAR_4c3261d24a0fcd99435d63ff1fdd4a9cfbe45b74"]
        var ids3 = ["CAR_9f33746f5f20dece2135b18d93fae9f2f737546a", "CAR_0e1258b1e41d6aab3d69672ef2926a79d125fb71", "CAR_5ed046fd5c565f9f62ce60f1b6c009e8c34c1de5"]
        var ids4 = ["CAR_9f33746f5f20dece2135b18d93fae9f2f737546a", "CAR_3a153cad2e90cfd401b87be2e345c159747756fd", "CAR_1492f7ecaa07d6af0d41afdb1031835b8673aee5"]
        var ids5 = ["CAR_f327e39cd2d17863ebd8923a228583374deff08e", "CAR_3a153cad2e90cfd401b87be2e345c159747756fd", "MARCO_2881821"]

        
        var nodes1 = {"CAR_f327e39cd2d17863ebd8923a228583374deff08e": ["batman", "batmans", "nolan", "movies", "films"], "CAR_03303ef055dddb743a91a340e2c18c0e841c818e": ["batman", "nolan", "movies", "films"],  "MARCO_4722980": ["batman", "nolan"]}
      
        var nodes2 = {"CAR_815d1f6d811c8060b2d0f58eb12ef7359afb1162": ["alfred", "batman", "nolan", "role"], "CAR_f327e39cd2d17863ebd8923a228583374deff08e": ["batman", "batmans", "nolan", "role", "movies"], "CAR_4c3261d24a0fcd99435d63ff1fdd4a9cfbe45b74": ["alfred", "batman", "nolan", "role", "roles"]}
        
        var nodes3 = {"CAR_9f33746f5f20dece2135b18d93fae9f2f737546a": ["harvey", "dent", "batman", "nolan"],"CAR_0e1258b1e41d6aab3d69672ef2926a79d125fb71": [" harvey", "dent", "batman", "role"], "CAR_5ed046fd5c565f9f62ce60f1b6c009e8c34c1de5": ["harvey", "dent", "batman", "nolan", "role"]}
        
        var nodes4 = {"CAR_9f33746f5f20dece2135b18d93fae9f2f737546a": ["batman", "nolan", "harvey", "dent"],"CAR_3a153cad2e90cfd401b87be2e345c159747756fd": ["office", "batman", "reception", "box", "nolan"], "CAR_1492f7ecaa07d6af0d41afdb1031835b8673aee5": ["office", "batman", "box", "nolan", "films"]}
 
        var nodes5 = {"CAR_f327e39cd2d17863ebd8923a228583374deff08e": ["superman", "v", "batmans", "batman", "nolan"],"CAR_3a153cad2e90cfd401b87be2e345c159747756fd": [" superman", "v", "batman", "nolan", "movies"], "MARCO_2881821": ["superman", "v", "batman", "movie", "vs"]}
        
       
        var edges1 = {"CAR_f327e39cd2d17863ebd8923a228583374deff08e": ["(batman, nolan)"], "CAR_03303ef055dddb743a91a340e2c18c0e841c818e": ["(batman, nolan)"], "MARCO_4722980": ["(batman, nolan)"]}
      
        var edges2 = {"CAR_815d1f6d811c8060b2d0f58eb12ef7359afb1162": ["(batman, nolan)", "(batman, role)"], "CAR_f327e39cd2d17863ebd8923a228583374deff08e": ["(batman, nolan)"], "CAR_4c3261d24a0fcd99435d63ff1fdd4a9cfbe45b74": ["(batman, role)"]}
        
        var edges3 = {"CAR_9f33746f5f20dece2135b18d93fae9f2f737546a": ["(dent, harvey)"],"CAR_0e1258b1e41d6aab3d69672ef2926a79d125fb71": [" (dent, harvey)", "(batman, dent)", "(batman, harvey)"], "CAR_5ed046fd5c565f9f62ce60f1b6c009e8c34c1de5": [" (dent, harvey)", "(batman, role)"]}
       
        var edges4 = {"CAR_9f33746f5f20dece2135b18d93fae9f2f737546a": [" (dent, harvey)"],"CAR_3a153cad2e90cfd401b87be2e345c159747756fd": ["(box, office)", "(batman, films)", "(batman, movies)", "(movies, nolan)"], "CAR_1492f7ecaa07d6af0d41afdb1031835b8673aee5": ["(dent, harvey)", "(box, office)", "(harvey, nolan)"]}
       
        var edges5 = {"CAR_f327e39cd2d17863ebd8923a228583374deff08e": ["(batman, superman)", "(superman, v)", "(batman, nolan)", "(batman, v)"],"CAR_3a153cad2e90cfd401b87be2e345c159747756fd": [" (batman, superman)", "(superman, v)", "(batman, v)", "(box, office)", "(batman, films)"], "MARCO_2881821": ["(batman, superman)", "(superman, v)", "(batman, v)", "(batman, movie)", "(movie, superman)"]}
       
        var topsentences1 = {"CAR_f327e39cd2d17863ebd8923a228583374deff08e": [1,14,6], "CAR_03303ef055dddb743a91a340e2c18c0e841c818e": [4, 12, 15], "MARCO_4722980":[2]}
        var topsentences2 = {"CAR_815d1f6d811c8060b2d0f58eb12ef7359afb1162":[2,3,5], "CAR_f327e39cd2d17863ebd8923a228583374deff08e":[1,13, 14], "CAR_4c3261d24a0fcd99435d63ff1fdd4a9cfbe45b74":[2,4,6]}
        var topsentences3 = {"CAR_9f33746f5f20dece2135b18d93fae9f2f737546a":[2,3,5], "CAR_0e1258b1e41d6aab3d69672ef2926a79d125fb71":[1,5,7], "CAR_5ed046fd5c565f9f62ce60f1b6c009e8c34c1de5":[2,7,8]}
        var topsentences4 = {"CAR_9f33746f5f20dece2135b18d93fae9f2f737546a":[2,3,5], "CAR_3a153cad2e90cfd401b87be2e345c159747756fd":[4,5,6], "CAR_1492f7ecaa07d6af0d41afdb1031835b8673aee5":[1,2,6]}
        var topsentences5 = {"CAR_f327e39cd2d17863ebd8923a228583374deff08e":[13,14,16], "CAR_3a153cad2e90cfd401b87be2e345c159747756fd":[5,6,10], "MARCO_2881821":[1]}
       
        this.setState({questions:  quest ,answers: [aw5, aw4, aw3, aw2, aw1], answerids: [ids5, ids4, ids3, ids2, ids1], nodes: [nodes5, nodes4, nodes3, nodes2, nodes1], edges: [edges5, edges4, edges3, edges2, edges1], turn: 4, topsentences: [topsentences5,topsentences4, topsentences3, topsentences2, topsentences1 ], sample: true} )
        

    }


    render() {
        var errorStyle = {color:"#FF0000", "margiBottom": "70px"}
        var widthstyle = { width: "80%"}
        var margin = {"marginTop": "20px" , "marginBottom": "50px"}
       
        // <img  src="crown_head.png" className=".responsive-image"  width="150" height="50" alt="" style={marginT}/> 
        return (
            <div className="full-container" >
           
                <h3  align="center" style={margin}>CROWN: Conversational Question Answering over Passages by Leveraging Word Proximity Networks</h3>
              
                <div className="flex-row">
                    <div className="flex-small">
                        <div className="container" align="justify" style={widthstyle} >
                            {this.state.err && <div className="error-message"><h3 align="center" style={errorStyle}>{this.state.err}</h3></div>}
                            {this.state.api_err && <div className="error-message2"> <h3 align="center" style={errorStyle}>{"Service temporarily not reachable, please try again"}</h3></div>}
                            <Form handleSubmit={this.handleSubmit} onSubmit={this.handleSubmit} handleClearConv={this.handleClearConv} handleClearLastTurn={this.handleClearLastTurn} />  {  }   
                            <LoadingIndicator/> {  }  
                            <TableBody questions={this.state.questions} answers={this.state.answers} answerids={this.state.answerids} nodes={this.state.nodes} edges={this.state.edges} turn={this.state.turn} topsentences={this.state.topsentences} sample={this.state.sample}/>
                            <Description/>
                        </div>
                    </div>
                 
                    <div className="flex-small">                  
                        <div className="container" style={widthstyle}>
                            <SampleQuestion showSampleAnswers={this.showSampleAnswers}/> { }
                            <Options onChange={this.handleOptionChange} onRestore={this.handleRestore} retNbr={this.state.retNbr} indriRetNbr={this.state.indriRetNbr} nodeThreshold={this.state.nodeThreshold} edgeThreshold={this.state.edgeThreshold} convquery={this.state.convquery} h1={this.state.h1} h2={this.state.h2} h3={this.state.h3} h4={this.state.h4} />
                        </div>
                    </div>
                </div>
                <Footer/>
            </div>
        );  
    };
   
}

const SampleQuestion = props  => {
    var marginbutton = {"textAlign": "left"};
      
    const {showSampleAnswers} = props
    return(
                  
        <table>
            <thead> 
                <tr key={'sampleconv_head'}>
                <th>Sample Conversation</th>
                
                </tr>
            </thead>
            <tbody>
                <tr className="no-bottom-border" key={'turn1'}>
                    <td>
                        <b>Turn 1: </b> when did nolan make his batman movies? <br/>     
                        <b>Turn 2: </b> who played the role of alfred? <br/>
                        <b>Turn 3: </b> and what about harvey dent?<br/>
                        <b>Turn 4: </b> how was the box office reception?<br/>
                        <b>Turn 5: </b>compared to Batman v Superman?
                    </td>
                </tr>
              
              
                <tr key={'buttonrow'} >
                    <td><button className="button"  onClick={showSampleAnswers} title="show answers for the sample conversation" style={marginbutton}>Answer Sample</button></td>
                </tr>  
            </tbody>   
        </table>
    )
}

const Description = () => {
    return (
        <table >
            <thead> 
                <tr key={'description'}>
                    <th>Description</th>
                </tr>
            </thead>
            <tbody>
               <tr key={'desc'}>
                    <td>
                        <p  align="justify">CROWN is an unsupervised approach for conversational passage ranking. Answers are retrieved from MS MARCO and TREC CAR datasets. We formulated the objective of maximizing the passage score for a query as a combination of similarity and coherence. Passages are preferred that
contain words semantically similar to the words used in the question. Coherence
is expressed using term proximity. We built a word-proximity network
from the corpus, where words are nodes and there is an edge
between two nodes if they co-occur in the same passage in a statistically
significant way, within a context window. We use NPMI (normalized pointwise
mutual information) as a measure of this word association significance.</p>

            <p>Our code and further technical information are available <a href="https://github.com/magkai/CROWN">here</a>.</p>

                          <p>For feedback and clarifications, please contact:</p>
                            <ul>
                           
                                <li><a href="http://people.mpi-inf.mpg.de/~mkaiser/">Magdalena Kaiser</a> (mkaiser AT mpi HYPHEN inf DOT mpg DOT de)</li>
                                <li><a href="http://people.mpi-inf.mpg.de/~rsaharo/">Rishiraj Saha Roy</a> (rishiraj AT mpi HYPHEN inf DOT mpg DOT de)</li>
                                <li><a href="http://people.mpi-inf.mpg.de/~weikum/">Gerhard Weikum</a> (weikum AT mpi HYPHEN inf DOT mpg DOT de)</li>
                       
                            </ul>
                       
                    </td>
                </tr>
            </tbody>   
        </table>
    )
}

const LoadingIndicator = props => {
   const { promiseInProgress } = usePromiseTracker();

   return (
        promiseInProgress && 
        <div style={{ 
            width: "100%",
            height: "100",
            display: "flex",
            justifyContent: "center",
            alignItems: "center"}}>
            <Loader type="ThreeDots" color="#568ceb" height={100} width={100} />
        </div>
    );  
 }

  
const TableBody = props  => {
    
   const {questions, answers, answerids, nodes, edges, turn, topsentences, sample} = props;

   var tablelayout = {border: "0"} 
   
    return (
        <table style={tablelayout}> 
            <tbody  >
             {[...questions].reverse().map((question, index) => {
                 return (
                    <tr className="noBorder" key={index}>
                        <td>
                        <InnerTable question={question} answers={[...answers].reverse()[index]} answerids={[...answerids].reverse()[index]}  
                        nodes={[...nodes].reverse()[index]}  edges={[...edges].reverse()[index]}  nbr={index} turn={turn} topsentences={[...topsentences].reverse()[index]} sample={sample}/>
                        </td>
                    </tr>
                     
                 )})
            }
            </tbody>
        </table>
    );
  
   
}; 


const InnerTable = props => {
    
    const {question, answers, answerids, nodes, edges, nbr, turn, topsentences, sample} = props
    
    if(sample) {
        var tnbr = nbr+1;
     }else {
        tnbr = turn-nbr+1;
     }
     
     
    const rows = answers.map((answer, index) => {
        
     
         
       // console.log("answer before: " + answer.toString())
      //  console.log("top sent:" + topsentences) 
      //  console.log("curr top sent: " + topsentences[answerids[index]])
     
       var newanswer = "";
       //show important nodes and edges in bold in final answer
       for(var n = 0; n < answer.length; n++) {
            if(!answer[n].includes('<b>')) {               
                for (var i = 0; i < nodes[answerids[index]].length; i++) {
                    var find = nodes[answerids[index]][i]                
                    var pattern = `(\\s|\\b)(${find})(\\s|\\b)`;    
                    var regexp = new RegExp(pattern, 'ig'); // ignore case (optional) and match all
                    var replaceMask = `$1<b>$2</b>$3`;
                    answer[n] = answer[n].replace(regexp, replaceMask);       
                }
                for (var j = 0; j < edges[answerids[index]].length; j++) {
                    var edge = edges[answerids[index]][j].replace("(", "")     
                    edge = edge.replace(")", "")
                    var find1 = edge.split(",")[0];
                    var find2 = edge.split(",")[1];
                    var pattern1 = `(\\s|\\b)(${find1})(\\s|\\b)`;
                    var regexp1 = new RegExp(pattern1, 'ig'); // ignore case (optional) and match all
                    var pattern2 = `(\\s|\\b)(${find2})(\\s|\\b)`;
                    var regexp2 = new RegExp(pattern2, 'ig'); 
                    var replaceMask2 = `$1<b>$2</b>$3`;
                    answer[n] = answer[n].replace(regexp1, replaceMask2);
                    answer[n] = answer[n].replace(regexp2, replaceMask2);
                }
            }
            if(!answer[n].includes('<mark>')) {
            //highlight top sentences in passag
                for(var t = 0; t <topsentences[answerids[index]].length; t++) {
                    if(n+1 === parseInt(topsentences[answerids[index]][t])) {
                        answer[n] = '<mark>' + answer[n] + '</mark>'
                        break;

                    }
                
                }
            }
            
            newanswer += answer[n];
            
        }
        
        
        
        
        return(
            <tr className="no-bottom-border" key={"row_table".concat(index.toString())}>
                <td>
                    <table>
                        <tbody>
                            <tr  className="no-bottom-border" key={"".concat(nbr.toString()).concat("_").concat(index.toString())}>
                                <td><b>Rank {index+1}: </b> {ReactHtmlParser(newanswer)}  </td>    
                            </tr>
                            <tr  className="no-bottom-border" key={"index".concat(nbr.toString()).concat("_").concat(index.toString())}>
                                <td><b>Pasage Id: </b> [{answerids[index]}] </td>    
                            </tr>
                            <tr className="no-bottom-border" key={"nodes".concat(nbr.toString()).concat("_").concat(index.toString())}>
                                <td><b>Top Nodes: </b>{ nodes[answerids[index]].toString().replace(/,/g, ', ')}</td>
                            </tr>

                            <tr className="no-bottom-border" key={"edges".concat(nbr.toString()).concat("_").concat(index.toString())}>  
                                <td><b>Top Edges:</b> { edges[answerids[index]].toString().replace(/,/g, ', ')}</td>
                            </tr>
                        </tbody>
                    </table>
                </td>
            </tr>
        );  
        
    });

    return (
        <table>
           <thead>
                <tr key={question}>
                    <th>Results for Turn {tnbr}: {question}</th>
                </tr>
           </thead>
           <tbody>{rows}</tbody>
        </table>
    )
       //<th>Results for Turn {turn-nbr+1}: {question}</th>
};


const Footer = () => {
    
    return (
        <div>
            <footer className="footer" >
                <hr/>
                <div className="full-container">
                    <p align="right">         
                       
                        © <a href="https://www.mpi-inf.mpg.de/departments/databases-and-information-systems/" target="_blank" rel="noopener noreferrer">Database
                                                            &amp; Information Systems Group</a>, <a href="http://www.mpi-inf.mpg.de/home/" target="_blank" rel="noopener noreferrer">Max Planck Institute
                                                            for Informatics</a>. 2020.{ } | { }
                        <a href="https://imprint.mpi-klsb.mpg.de/inf/crown.mpi-inf.mpg.de" target="_blank" rel="noopener noreferrer">Imprint</a>{ } | { }
                        <a href="https://data-protection.mpi-klsb.mpg.de/inf/crown.mpi-inf.mpg.de" target="_blank" rel="noopener noreferrer">Data Protection</a>
                        <img src="Logo_MPII.png" className=".responsive-image"  width="200" height="50" alt=""/>            
                    </p> 
                </div>               
            </footer>
        </div>
    )  
};


export default App
