import React, {
    Component,
    Fragment
} from "react";
import {
    elasticsearchConnectionTag
} from '../helpers/elasticsearchConnectionTag';

class Autocomplete extends Component {

    static defaultProps = {
        suggestions: []
    };

    constructor(props) {
        super(props);

        this.state = {
            // The active selection's index
            activeSuggestion: 0,
            // The suggestions that match the user's input
            filteredSuggestions: this.props.suggestions,
            // Whether or not the suggestion list is shown
            showSuggestions: false,
            // What the user has entered
            userInput: this.props.row._source.attrs.tags ? this.props.row._source.attrs.tags : "",
            row: this.props.row,
            suggestions: this.props.suggestions
        };
    }

    async tag(directTag = "") {
        if (this.state.row) {
            var id = this.state.row._id;
            var index = this.state.row._index;
            var tag = directTag === "" ? this.state.userInput : directTag;
            if (tag && tag !== "" && tag !== " ") {
                tag = tag.replace(/\s/g, '');
                if (!Array.isArray(tag)) {
                    tag = tag.split(",");
                }
                var data = await elasticsearchConnectionTag("api/tag", id, index, tag);
                if (data.result && (data.result === "updated" || data.result === "noop")) {
                    // alert("Tag has been saved."); 

                    //if new tag was created, add it to the list of suggestions
                    var tags = this.state.suggestions;

                    if (Array.isArray(tag)) {
                        for (var j = 0; j < tag.length; j++) {
                            if (!tags.includes(tag[j])) {
                                tag[j] = tag[j].replace(/\s/g, '');
                                tags.push(tag[j]);
                                this.setState({
                                    suggestions: tags
                                });
                            }
                        }
                    }
                    else {
                        if (!tags.includes(tag)) {
                            tags.push(tag);
                            this.setState({
                                suggestions: tags
                            });
                        }
                    }

                } else {
                    alert(JSON.stringify(data));
                }
            }

        }
    }

    // Event fired when the input value is changed
    onChange = e => {
        e.preventDefault();
        var suggestions = this.state.suggestions;
        var userInput = e.currentTarget.value;
        if (userInput.lastIndexOf(",")) {
            userInput = userInput.substring(userInput.lastIndexOf(",") + 1);
        }
        // Filter our suggestions that don't contain the user's input
        const filteredSuggestions = suggestions.filter(
            suggestion =>
                suggestion.toLowerCase().indexOf(userInput.toLowerCase()) > -1
        );

        // Update the user input and filtered suggestions, reset the active
        // suggestion and make sure the suggestions are shown
        this.setState({
            activeSuggestion: 0,
            filteredSuggestions,
            showSuggestions: true,
            userInput: e.currentTarget.value
        });
    };

    //save to ES
    onFocusout = e => {
        this.tag();        
    };


    // Event fired when the user clicks on a suggestion
    onClick = async e => {
        var userInput = this.state.userInput + e.currentTarget.innerText;

        // Update the user input and reset the rest of the state
        this.setState({
            activeSuggestion: 0,
            filteredSuggestions: [],
            showSuggestions: false,
            userInput: userInput
        }, await this.tag(userInput));

        //document.getElementById("tagsFilter").focus();
    };

    //on input click show suggestions
    onClickInput = e => {
        var suggestions = this.state.suggestions;
        var userInput = this.state.userInput + e.currentTarget.innerText;
        // Update the user input and reset the rest of the state
        this.setState({
            activeSuggestion: 0,
            filteredSuggestions: suggestions,
            showSuggestions: true,
            userInput: userInput
        });
    };

    // Event fired when the user presses a key down
    onKeyDown = e => {
        const {
            activeSuggestion,
            filteredSuggestions
        } = this.state;

        // User pressed the enter key, update the input and close the
        // suggestions
        if (e.keyCode === 13) {
            /* this.setState({
               activeSuggestion: 0,
               showSuggestions: false,
               userInput: filteredSuggestions[activeSuggestion]
             });*/
            //document.getElementById("filterButton").click();
        }
        // User pressed the up arrow, decrement the index
        else if (e.keyCode === 38) {
            if (activeSuggestion === 0) {
                return;
            }

            this.setState({
                activeSuggestion: activeSuggestion - 1
            });
        }
        // User pressed the down arrow, increment the index
        else if (e.keyCode === 40) {
            if (activeSuggestion - 1 === filteredSuggestions.length) {
                return;
            }

            this.setState({
                activeSuggestion: activeSuggestion + 1
            });
        }
    };

    UNSAFE_componentWillReceiveProps(nextProps) {
        if (nextProps.enter !== this.props.userInput) {
            this.setState({
                userInput: ""
            });
        }
    }


    render() {
        const {
            onChange,
            onClick,
            onKeyDown,
            onFocusout,
            onClickInput,
            state: {
                activeSuggestion,
                filteredSuggestions,
                showSuggestions,
                userInput
            }
        } = this;

        let suggestionsListComponent;
        if (showSuggestions) {
            if (filteredSuggestions.length) {
                suggestionsListComponent = (<ul className="suggestionsTag" > {
                    filteredSuggestions.map((suggestion, index) => {
                        let className;
                        // Flag the active suggestion with a class
                        if (index === activeSuggestion) {
                            className = "suggestion-active";
                        }
                        return (
                            <li className={className}
                                key={index}
                                onClick={onClick} >
                                { suggestion}
                            </li>
                        );
                    })
                } </ul>
                );
            } else {
                suggestionsListComponent = (<div className="no-suggestions" ></div>
                );
            }
        }

        return (<Fragment >
            <input type="text"
                onChange={onChange}
                onKeyDown={onKeyDown}
                onClick={onClickInput}
                onBlur={onFocusout}
                value={userInput}
                id="tagsFilter"
                autoComplete="off"
            /> {suggestionsListComponent}
        </Fragment>
        );
    }
}

export default Autocomplete;
