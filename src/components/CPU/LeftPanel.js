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
	};

	render() {
		return (
			<div className="LeftPanel">
				<Tabs forceRenderTabPanel={true}>
					<TabList>
						<Tab>Regs</Tab>
						<Tab>Funcs</Tab>
						<Tab>Tools</Tab>
					</TabList>
					<TabPanel>
						<RegPanel {...this.props} />
					</TabPanel>
					<TabPanel>
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
