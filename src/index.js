import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

function FormEntry(props) {
  const className = props.className || (props.label ? "" : "col-sm-offset-3 ") + "col-sm-9";

  return (
    <div className="form-group">
      {props.label &&
        <label htmlFor={props.children.props.id} className="control-label col-sm-3">{props.label}</label>
      }
      <div className={className}>
        {props.children}
      </div>
    </div>
  );
}

function FormCheckbox(props) {
  return (
    <FormEntry>
      <div className="checkbox">
        <label>
          <input type="checkbox" checked={props.checked} onChange={props.onChange} />
          {props.label}
        </label>
      </div>
    </FormEntry>
  );
}

function FormTextbox(props) {
  return (
    <FormEntry label={props.label}>
      <input type="text" id={props.id} placeholder={props.placeholder} className="form-control" value={props.value} onChange={props.onChange} />
    </FormEntry>
  );
}

class GpgAssist extends React.Component {
  constructor() {
    super();

    this.state = {
      selectedCommandIndex: -1,
      command: '',
      hasArmor: false,
      isMinimal: false,
      input: false,
      inputFile: '',
      output: false,
      outputFile: '',
      recipient: '',
      key: '',
      isExpert: false
    };

    this.buildCommandLine(this.state);
  }

  availableCommands = [
    { description: "generate a new key", command: "--generate-key", expertCommand: "--expert --full-generate-key" },
    { description: "edit a key", command: "--edit-key", expertCommand: "--expert --edit-key", opKey: true },
    { description: "list all keys", command: "--list-keys", opKey: true },
    { description: "list all keys with their fingerprints", command: "--fingerprint", opKey: true },
    { description: "export a public key", command: "--export", opArmor: true, opMinimal: true, opOutput: true, opKey: true },
    { description: "export a private key", command: "--export-secret-key", opArmor: true, opOutput: true, opKey: true },
    { description: "import a key", command: "--import", opInput: true },
    { description: "delete a public key", command: "--delete-keys", opKey: true },
    { description: "delete a private key", command: "--delete-secret-keys", opKey: true },
    { description: "sign a key", command: "--sign-key", expertCommand: "--ask-cert-level --sign-key", opKey: true },
    { description: "sign a message", command: "--sign", opArmor: true, opOutput: true, opInput: true },
    { description: "encrypt a message", command: "--encrypt", opArmor: true, opOutput: true, opRecipient: true, opInput: true },
    { description: "decrypt a message", command: "--decrypt", opOutput: true, opInput: true },
    { description: "verify a message", command: "--verify", opInput: true }
  ];

  updateCommand(key, value) {
    const state = {
      ...this.state,
      [key]: value
    };

    this.setState({
      ...state,
      command: this.buildCommandLine(state)
    });
  }

  buildCommandLine(state) {
    const selectedCommand = this.availableCommands[state.selectedCommandIndex];
    
    if (!selectedCommand) {
      return "";
    }

    const commandLine = ["gpg"];

    if (selectedCommand.opArmor && state.hasArmor) {
      commandLine.push("--armor");
    }

    if (selectedCommand.opMinimal && state.isMinimal) {
      commandLine.push("--export-options export-minimal");
    }
    
    if (selectedCommand.opOutput && state.output && state.outputFile) {
      commandLine.push("--output");
      commandLine.push(state.outputFile);
    }

    if (selectedCommand.opRecipient && state.recipient) {
      commandLine.push("--recipient");
      commandLine.push(state.recipient);
    }
    
    if (selectedCommand.expertCommand && state.isExpert) {
      commandLine.push(selectedCommand.expertCommand);
    }
    else {
      commandLine.push(selectedCommand.command);
    }

    if (selectedCommand.opKey && state.key) {
      commandLine.push(state.key);
    }

    if (selectedCommand.opInput && state.input && state.inputFile) {
      commandLine.push(state.inputFile);
    }
    
    return commandLine.join(" ");
  }

  renderCheckbox(label, key) {
    return (
      <FormCheckbox label={label} checked={this.state[key]} onChange={(e) => this.updateCommand(key, e.target.checked)} />
    );
  }

  renderTextbox(label, placeholder, key) {
    return (
      <FormTextbox id={key} placeholder={placeholder} label={label} value={this.state[key]} onChange={(e) => this.updateCommand(key, e.target.value)} />
    );
  }

  render() {
    const state = this.state;
    const selectedCommand = this.availableCommands[state.selectedCommandIndex];

    const options = (selectedCommand ? [] : [<option key={-1} value="-1"></option>])
      .concat(this.availableCommands.map((x, i) =>
        <option key={i} value={i}>{x.description}</option>
      ));

    return (
      <form className="form-horizontal">
        <FormEntry className="col-sm-12">
          <div className="input-group input-group-lg codebox">
            <span className="input-group-addon">&gt;</span>
            <input type="text" readOnly className="form-control" value={state.command} />
          </div>
        </FormEntry>
          
        <FormEntry label="I want to">
          <select id="selectedCommand" className="form-control" value={state.selectedCommandIndex} onChange={(e) => this.updateCommand("selectedCommandIndex", e.target.value)}>
            {options}
          </select>
        </FormEntry>

        {selectedCommand && selectedCommand.opArmor && this.renderCheckbox("with armor", "hasArmor")}

        {selectedCommand && selectedCommand.opMinimal && this.renderCheckbox("with minimal output", "isMinimal")}

        {selectedCommand && selectedCommand.opInput &&
          <FormEntry label="from">
            <select id="input" className="form-control" value={state.input ? "1" : "0"} onChange={(e) => this.updateCommand("input", e.target.value === "1")}>
              <option value="0">the standard input (stdin)</option>
              <option value="1">the following input file</option>
            </select>
          </FormEntry>
        }

        {selectedCommand && selectedCommand.opInput && state.input && this.renderTextbox(null, "(input file)", "inputFile")}

        {selectedCommand && selectedCommand.opOutput &&
          <FormEntry label="to">
            <select id="output" className="form-control" value={state.output ? "1" : "0"} onChange={(e) => this.updateCommand("output", e.target.value === "1")}>
              <option value="0">the standard output (stdout)</option>
              <option value="1">the following output file</option>
            </select>
          </FormEntry>
        }

        {selectedCommand && selectedCommand.opOutput && state.output && this.renderTextbox(null, "(output file)", "outputFile")}

        {selectedCommand && selectedCommand.opRecipient && this.renderTextbox("the recipient is", null, "recipient")}

        {selectedCommand && selectedCommand.opKey && this.renderTextbox("the key id is", null, "key")}

        {selectedCommand && selectedCommand.expertCommand && this.renderCheckbox("trust me, I'm an expert!", "isExpert")}
      </form>
    );
  }
}

ReactDOM.render(
  <div>
    <div className="jumbotron">
      <div className="container">
        <h1>GPG Assist</h1>
        <p>GnuPG CLI command builder, showcasing some of the available commands</p>
      </div>
    </div>

    <div className="container">
      <GpgAssist />
    </div>

    <footer className="footer">
      <div className="container">
        <p className="text-muted">Developed by <a href="https://www.pedrolamas.com">Pedro Lamas</a>, powered by <a href="https://facebook.github.io/react/">React</a> and <a href="http://getbootstrap.com">Bootstrap</a>, hosted on <a href="https://pages.github.com">Github Pages</a></p>
      </div>
    </footer>
  </div>,
  document.getElementById('root')
);
