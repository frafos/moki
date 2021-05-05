import React, {
    Component,
    Fragment
} from "react";
import PropTypes from "prop-types";

//Input field with hints when user writes
class Autocomplete extends Component {
    static propTypes = {
        suggestions: PropTypes.instanceOf(Array)
    };

    static defaultProps = {
        suggestions: []
    };

    constructor(props) {
        super(props);

        this.state = {
            // The active selection's index
            activeSuggestion: 0,
            // The suggestions that match the user's input
            filteredSuggestions: [],
            // Whether or not the suggestion list is shown
            showSuggestions: false,
            // What the user has entered
            userInput: "",
            tags: this.props.tags
        };
    }

    // Event fired when the input value is changed
    onChange = e => {
        const {
            suggestions
        } = this.props;
        const userInput = e.currentTarget.value;
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

        if (userInput === "tags:" || userInput === "tags: ") {
            this.setState({
                filteredSuggestions: this.state.tags,
                showSuggestions: true
            });
        }
    };

    // Event fired when the user clicks on a suggestion
    onClick = e => {
        // if you already wrote whole tags string
        if (this.state.userInput === "tags:" || this.state.userInput === "tags: ") {
            this.setState({
                userInput: this.state.userInput + e.currentTarget.innerText,
                activeSuggestion: 0,
                filteredSuggestions: [],
                showSuggestions: false,
            });
        }
        //if you choose tag from dropdown, axtivate tags options
        else if (e.currentTarget.innerText === "tags") {

            this.setState({
                userInput: e.currentTarget.innerText + ": ",
                filteredSuggestions: this.state.tags,
                showSuggestions: true
            });
        } else {
            this.setState({
                userInput: e.currentTarget.innerText + ": ",
                activeSuggestion: 0,
                filteredSuggestions: [],
                showSuggestions: false,
            });
        }

        document.getElementById("searchBar").focus();
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
            document.getElementById("filterButton").click();
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

    componentWillReceiveProps(nextProps) {
        if (nextProps.enter !== this.props.userInput) {
            this.setState({
                userInput: ""
            });
        }
        
        if (nextProps.tags !== this.props.tags) {
            this.setState({
                tags: nextProps.tags 
            });
        }
    }


    render() {
        const {
            onChange,
            onClick,
            onKeyDown,
            state: {
                activeSuggestion,
                filteredSuggestions,
                showSuggestions,
                userInput
            }
        } = this;

        let suggestionsListComponent;

        if (showSuggestions && userInput) {
            if (filteredSuggestions.length) {
                suggestionsListComponent = ( <
                    ul className = "suggestions" > {
                        filteredSuggestions.map((suggestion, index) => {
                            let className;

                            // Flag the active suggestion with a class
                            if (index === activeSuggestion) {
                                className = "suggestion-active";
                            }

                            return ( <
                                li className = {
                                    className
                                }
                                key = {
                                    suggestion
                                }
                                onClick = {
                                    onClick
                                } > {
                                    suggestion
                                } <
                                /li>
                            );
                        })
                    } <
                    /ul>
                );
            } else {
                suggestionsListComponent = ( <
                    div className = "no-suggestions" >
                    <
                    /div>
                );
            }
        }

        return ( <
            Fragment >
            <
            input type = "text"
            onChange = {
                onChange
            }
            onKeyDown = {
                onKeyDown
            }
            value = {
                userInput
            }
            id = "searchBar"
            placeholder = "FILTER: attribute:value"
            autoComplete = "new-password" /
            >
            {
                suggestionsListComponent
            } <
            /Fragment>
        );
    }
}

export default Autocomplete;
