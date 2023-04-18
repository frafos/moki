import { Component } from 'react';

class CountryFlag extends Component {
    constructor(props) {
        super(props);
        this.state = {
            picture: null,
            countryCode: null
        }
        this.getCountryFlag = this.getCountryFlag.bind(this);
    }

    componentDidMount() {
        this.setState({ countryCode: this.props.countryCode });
        this.getCountryFlag(this.props.countryCode);
    }


      //after redirect delete unpinned filters
      UNSAFE_componentWillReceiveProps(nextProps) {
        if (nextProps.countryCode !== this.props.countryCode) {
            this.setState({ countryCode: nextProps.countryCode });
            this.getCountryFlag(nextProps.countryCode);
        }
    }

    async getCountryFlag(countryCode) {
        const picture = await import(`../../assets/flags/${countryCode.toLowerCase()}.png`)
          .catch(() => null);
        if (picture) {
          this.setState({ picture: picture.default });
        } else {
          this.setState({ picture: null });
        }
    }

    render() {
        return (
            <span>
              {this.state.picture != null && 
                <img alt="flag" src={this.state.picture} 
                    style={{ "width": "20px", 
                        "height": "14px","marginBottom": "2px", 
                        "marginRight": "2px" }}>
                </img>}
            </span>
        )
    }
}

export default CountryFlag;