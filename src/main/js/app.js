'use strict';

const React = require( 'react' );
const ReactDOM = require( 'react-dom' );
const when = require( 'when' );

const client = require( './client' );
const follow = require( './follow' );

const root = '/api';

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

class UpdateDialog extends React.Component {

    constructor( props ) {
        super( props );
        this.handleSubmit = this.handleSubmit.bind( this );
    }

    handleSubmit( e ) {
        e.preventDefault();

        var updatedDietary = {};
        this.props.attributes.forEach( attribute => {
            updatedDietary[attribute] = ReactDOM.findDOMNode( this.refs[attribute] ).value.trim();
        } );
        this.props.onUpdate( this.props.dietary, updatedDietary );

        window.location = "#";
    }

    render() {
        var inputs = this.props.attributes.map( attribute =>
            <p key={this.props.dietary.entity[attribute]}>
                <input type="text" placeholder={attribute}
                    defaultValue={this.props.dietary.entity[attribute]}
                    ref={attribute} className="field" />
            </p>
        );

        var dialogId = "updateDietary-" + this.props.dietary.entity._links.self.href;

        return (
            <div>
                <a href={"#" + dialogId}>Update</a>

                <div id={dialogId} className="modalDialog">
                    <div>
                        <a href="#" title="Close" className="close">X</a>

                        <h2>Update an dietary</h2>

                        <form>
                            {inputs}
                            <button onClick={this.handleSubmit}>Update</button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

}

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
                <td>{this.props.dietary.entity.food}</td>
                <td>{this.props.dietary.entity.gram}</td>
                <td>
                    <UpdateDialog dietary={this.props.dietary}
                        attributes={this.props.attributes}
                        onUpdate={this.props.onUpdate} />
                </td>
                <td>
                    <button onClick={this.handleDelete}>Delete</button>
                </td>
            </tr>
        );
    }

}

class DietaryList extends React.Component {

    render() {
        var dietaries = this.props.dietaries.map( dietary =>
            <Dietary dietary={dietary} attributes={this.props.attributes}
                onUpdate={this.props.onUpdate} onDelete={this.props.onDelete} />
        );

        return (
            <table>
                <tbody>
                    <tr>
                        <th>Food</th>
                        <th>Gram</th>
                        <th>Update</th>
                        <th>Delete</th>
                    </tr>
                    {dietaries}
                </tbody>
            </table>
        );
    }

}

class App extends React.Component {

    constructor( props ) {
        super( props );
        this.state = { dietaries: [], attributes: [] };
        this.onCreate = this.onCreate.bind( this );
        this.onUpdate = this.onUpdate.bind( this );
        this.onDelete = this.onDelete.bind( this );
    }

    componentDidMount() {
        this.loadFromServer();
    }

    loadFromServer() {
        follow( client, root, ['dietaries'] ).then( dietaryCollection => {
            return client( {
                method: 'GET',
                path: dietaryCollection.entity._links.profile.href,
                headers: { 'Accept': 'application/schema+json' }
            } ).then( schema => {
                this.schema = schema.entity;
                return dietaryCollection;
            } );
        } ).then( dietaryCollection => {
            return dietaryCollection.entity._embedded.dietaries.map( dietary =>
                client( {
                    method: 'GET',
                    path: dietary._links.self.href
                } )
            );
        } ).then( dietaryPromises => {
            return when.all( dietaryPromises );
        } ).done( dietaries => {
            this.setState( {
                dietaries: dietaries,
                attributes: Object.keys( this.schema.properties ),
            } );
        } );
    }

    onCreate( newDietary ) {
        follow( client, root, ['dietaries'] ).then( dietaryCollection => {
            return client( {
                method: 'POST',
                path: dietaryCollection.entity._links.self.href,
                entity: newDietary,
                headers: { 'Content-Type': 'application/json' }
            } )
        } ).done( response => {
            this.loadFromServer();
        } );
    }

    onUpdate( dietary, updatedDietary ) {
        client( {
            method: 'PUT',
            path: dietary.entity._links.self.href,
            entity: updatedDietary,
            headers: {
                'Content-Type': 'application/json'
            }
        } ).done( response => {
            this.loadFromServer();
        } );
    }

    onDelete( dietary ) {
        client( {
            method: 'DELETE',
            path: dietary.entity._links.self.href
        } ).done( response => {
            this.loadFromServer();
        } );
    }

    render() {
        return (
            <div>
                <CreateDialog onCreate={this.onCreate} attributes={this.state.attributes} />
                <DietaryList dietaries={this.state.dietaries} onUpdate={this.onUpdate}
                    attributes={this.state.attributes} onDelete={this.onDelete} />
            </div>
        );
    }
}

ReactDOM.render(
    <App />,
    document.getElementById( 'react' )
);
