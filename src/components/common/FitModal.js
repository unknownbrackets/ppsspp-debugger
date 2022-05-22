import { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-modal';
import '../ext/react-modal.css';

class FitModal extends PureComponent {
	render() {
		return (
			<Modal
				className="ReactModal__FitContent" overlayClassName="ReactModal__FitOverlay"
				onRequestClose={this.handleRequestClose}
				closeTimeoutMS={150}
				{...this.props}
			/>
		);
	}

	handleRequestClose = () => {
		if (this.props.confirmClose) {
			if (!window.confirm(this.props.confirmClose)) {
				// Don't close.
				return;
			}
		}

		this.props.onClose();
	};
}

FitModal.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	onClose: PropTypes.func.isRequired,
	confirmClose: PropTypes.string,
	children: PropTypes.node,
};

export default FitModal;
