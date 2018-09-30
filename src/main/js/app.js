'use strict';

const React = require( 'react' );
const ReactDOM = require( 'react-dom' )
const client = require( './client' );

const follow = require( './follow' ); // function to hop multiple links by "rel"

const root = '/api';

// tag::app[]
class App extends React.Component {

    constructor( props ) {
        super( props );
        this.state = { dietaries: [], attributes: [], pageSize: 20, links: {} };
        this.onCreate = this.onCreate.bind( this );
        this.onDelete = this.onDelete.bind( this );
    }

    // tag::follow-2[]
    loadFromServer( pageSize ) {
        follow( client, root, [
            { rel: 'dietaries', params: { size: pageSize } }]
        ).then( dietaryCollection => {
            return client( {
                method: 'GET',
                path: dietaryCollection.entity._links.profile.href,
                headers: { 'Accept': 'application/schema+json' }
            } ).then( schema => {
                this.schema = schema.entity;
                return dietaryCollection;
            } );
        } ).done( dietaryCollection => {
            this.setState( {
                dietaries: dietaryCollection.entity._embedded.dietaries,
                attributes: Object.keys( this.schema.properties ),
                pageSize: pageSize,
                links: dietaryCollection.entity._links
            } );
        } );
    }
    // end::follow-2[]

    // tag::create[]
    onCreate( newDietary ) {
        follow( client, root, ['dietaries'] ).then( dietaryCollection => {
            return client( {
                method: 'POST',
                path: dietaryCollection.entity._links.self.href,
                entity: newDietary,
                headers: { 'Content-Type': 'application/json' }
            } )
        } ).then( response => {
            return follow( client, root, [
                { rel: 'dietaries', params: { 'size': this.state.pageSize } }] );
        } ).done( response => {
            this.loadFromServer( this.state.pageSize );
        } );
    }
    // end::create[]

    // tag::delete[]
    onDelete( dietary ) {
        client( { method: 'DELETE', path: dietary._links.self.href } ).done( response => {
            this.loadFromServer( this.state.pageSize );
        } );
    }
    // end::delete[]

    componentDidMount() {
        this.loadFromServer( this.state.pageSize );
    }

    render() {
        return (
            <div>
                <CreateDialog attributes={this.state.attributes} onCreate={this.onCreate} />
                <DietaryList onDelete={this.onDelete} dietaries={this.state.dietaries}
                    links={this.state.links} pageSize={this.state.pageSize} />
            </div>
        )
    }
}
// end::app[]


// tag::create-dialog[]
class CreateDialog extends React.Component {

    constructor( props ) {
        super( props );
        this.handleSubmit = this.handleSubmit.bind( this );
    }

    handleSubmit( e ) {
        e.preventDefault();
        var newDietary = {};
        this.props.attributes.forEach( attribute => {
            newDietary[attribute] = ReactDOM.findDOMNode( this.refs[attribute] ).value.trim();
        } );
        this.props.onCreate( newDietary );

        // clear out the dialog's inputs
        this.props.attributes.forEach( attribute => {
            ReactDOM.findDOMNode( this.refs[attribute] ).value = '';
        } );

        // Navigate away from the dialog to hide it.
        window.location = "#";
    }

    render() {
        var inputs = this.props.attributes.map( attribute =>
            <p key={attribute}>
                <input type="text" placeholder={attribute} ref={attribute} className="field" />
            </p>
        );

        return (
            <div>
                <a href="#createDietary">Create</a>

                <div id="createDietary" className="modalDialog">
                    <div>
                        <a href="#" title="Close" className="close">X</a>

                        <h2>Create new dietary</h2>

                        <form>
                            {inputs}
                            <button onClick={this.handleSubmit}>Create</button>
                        </form>
                    </div>
                </div>
            </div>
        )
    }

}
// end::create-dialog[]

// tag::employee-list[]
class DietaryList extends React.Component {
    render() {
        var dietaries = this.props.dietaries.map( dietary =>
            <Dietary key={dietary._links.self.href} dietary={dietary} onDelete={this.props.onDelete} />
        );
        return (
            <table>
                <tbody>
                    <tr>
                        <th>Food</th>
                        <th>Gram</th>
                        <th>Delete</th>
                    </tr>
                    {dietaries}
                </tbody>
            </table>
        )
    }
}
// end::employee-list[]

// tag::dietary[]
class Dietary extends React.Component {

    constructor( props ) {
        super( props );
        this.handleDelete = this.handleDelete.bind( this );
    }

    handleDelete() {
        this.props.onDelete( this.props.dietary );
    }

    render() {
        return (
            <tr>
                <td>{this.props.dietary.food}</td>
                <td>{this.props.dietary.gram}</td>
                <td>
                    <button onClick={this.handleDelete}>Delete</button>
                </td>
            </tr>
        )
    }
}
// end::dietary[]

// tag::render[]
ReactDOM.render(
    <App />,
    document.getElementById( 'react' )
)
// end::render[]

