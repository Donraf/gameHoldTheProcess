import React from "react";
import "./ImageButton.css";

class ImageButton extends React.Component {
  render() {
    return (
      <button className="ImageButton" disabled={this.props.disabled} onClick={this.props.onClick}>
        {this.props.children}
      </button>
    );
  }
}

export default ImageButton;
