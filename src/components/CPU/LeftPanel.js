import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import FuncList from './FuncList';
import RegPanel from './RegPanel';
import VisualizeVFPU from './VisualizeVFPU';
import './LeftPanel.css';
import '../ext/react-tabs.css';

class LeftPanel extends PureComponent {
	state = {
		vfpuModalOpen: false,
		// These can be slow, so we want to prevent render until it's selected.
		everShownFuncs: false,
	};

	render() {
		return (
			<div className="LeftPanel">
				<Tabs onSelect={this.handleSelect}>
					<TabList>
						<Tab>Regs</Tab>
						<Tab>Funcs</Tab>
						<Tab>Tools</Tab>
					</TabList>
					<TabPanel forceRender={true}>
						<RegPanel {...this.props} />
					</TabPanel>
					<TabPanel forceRender={this.state.everShownFuncs}>
						<FuncList {...this.props} />
					</TabPanel>
					<TabPanel className="react-tabs__tab-panel LeftPanel__tools">
						<button type="button" onClick={this.handleVFPUOpen}>Visualize VFPU</button>
					</TabPanel>
				</Tabs>

				<VisualizeVFPU {...this.props} isOpen={this.state.vfpuModalOpen} onClose={this.handleVFPUClose} />
			</div>
		);
	}

	handleSelect = (index) => {
		if (index === 1 && !this.state.everShownFuncs) {
			this.setState({ everShownFuncs: true });
		}
	}

	handleVFPUOpen = () => {
		this.setState({ vfpuModalOpen: true });
	}

	handleVFPUClose = () => {
		this.setState({ vfpuModalOpen: false });
	}
}

LeftPanel.propTypes = {
	ppsspp: PropTypes.object.isRequired,
	log: PropTypes.func.isRequired,
	stepping: PropTypes.bool,
	gotoDisasm: PropTypes.func.isRequired,
	currentThread: PropTypes.number,
};

export default LeftPanel;
