'use strict';

// tag::vars[]
const React = require('react');
const ReactDOM = require('react-dom');
const client = require('./client');
// end::vars[]

// tag::app[]
class App extends React.Component {

	constructor(props) {
		super(props);
		this.state = {dietaries: []};
	}

	componentDidMount() {
		client({method: 'GET', path: '/api/dietaries'}).done(response => {
			this.setState({dietaries: response.entity._embedded.dietaries});
		});
	}

	render() {
		return (
			<DietaryList dietaries={this.state.dietaries}/>
		)
	}
}
// end::app[]

// tag::employee-list[]
class DietaryList extends React.Component{
	render() {
		var dietaries = this.props.dietaries.map(dietary =>
			<Dietary key={dietary._links.self.href} dietary={dietary}/>
		);
		return (
			<table>
				<tbody>
					<tr>
						<th>Food</th>
						<th>Gram</th>
					</tr>
					{dietaries}
				</tbody>
			</table>
		)
	}
}
// end::employee-list[]

// tag::dietary[]
class Dietary extends React.Component{
	render() {
		return (
			<tr>
				<td>{this.props.dietary.food}</td>
				<td>{this.props.dietary.gram}</td>
			</tr>
		)
	}
}
// end::dietary[]

// tag::render[]
ReactDOM.render(
	<App />,
	document.getElementById('react')
)
// end::render[]

