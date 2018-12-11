/* Usable Sysbols ◎●←↑→↓↖↗↘↙ */

const mapID = [9720, 9920];					// MAP ID to input [ Normal Mode , Hard Mode ]

// BossAction[HuntingZoneId][TempalateId][Skill]
const BossActions = {
    // Normal Mode
    720: {
        // First Boss
        1000: {
            1116: {msg: 'Out ↓ In ↑'},
            2116: {msg: 'Out ↓ In ↑'}, // rage
            1117: {msg: 'In ↑ Out ↓'},
            2117: {msg: 'In ↑ Out ↓'}, // rage
            1300: {msg: 'Delete soon', deletionTimer: true}, // 'Your flesh will be deleted!'
        },
        // Second Boss NM
        2000: {
            // Second Boss NM
            1106: {msg: 'Spin ↓'},
            2106: {msg: 'Spin ↓'}, // rage
            3119: {msg: 'Red, Out safe ↓'},
            3220: {msg: 'Blue, In safe ↑'},   
        },
        // Third Boss NM
        3000: {
            // Third Boss NM
            1113: {msg: 'Front, Back stun ↓'},
            2113: {msg: 'Front, Back stun ↓'}, // rage
            1111: {msg: '→ Right Safe →', msgForTanks: '← Left Safe ←'},
            2111: {msg: '→ Right Safe →', msgForTanks: '← Left Safe ←'}, // rage
            1109: {msg: '← Left Safe ←',  msgForTanks: '→ Right Safe →'},
            2109: {msg: '← Left Safe ←',  msgForTanks: '→ Right Safe →'}, // rage
            1104: {msg: 'Back stun ↓', checkTwoUp: true},
            2104: {msg: 'Back stun ↓', checkTwoUp: true}, // rage            
        }
    },
    // Hard Mode
    920: {
        // First Boss HM
        1000: {
            1130: {msg: 'In ↑ Out ↓'}, // (big aoe)
            2130: {msg: 'Out ↓ In ↑'}, // (big aoe) rage
            1116: {msg: 'Out ↓ In ↑'},
            2116: {msg: 'Out ↓ In ↑'}, // rage
            1117: {msg: 'In ↑ Out ↓'},
            2117: {msg: 'In ↑ Out ↓'}, // rage
            1300: {msg: 'Delete soon', deletionTimer: true},
        },
        // Second Boss HM
        2000: {
            1106: {msg: 'Spin ↓'},
            2106: {msg: 'Spin ↓'}, // rage
            3119: {msg: 'Red, Out safe ↓'},
            3220: {msg: 'Blue, In safe ↑'},    
        },
        // Third Boss HM
        3000: {
            1113: {msg: 'Front, back stun ↓'},
            2113: {msg: 'Front, back stun ↓'}, // rage
            1111: {msg: '→ Right Safe, OUT safe', msgForTanks: '← Left Safe, OUT safe'},
            2111: {msg: '→ Right Safe, OUT safe', msgForTanks: '← Left Safe, OUT safe'}, // rage
            1109: {msg: '← Left Safe, IN safe',   msgForTanks: '→ Right Safe, IN safe'},
            2109: {msg: '← Left Safe, IN safe',   msgForTanks: '→ Right Safe, IN safe'}, // rage
            1104: {msg: 'Back stun ↓', checkTwoUp: true}, // HM
            2104: {msg: 'Back stun ↓', checkTwoUp: true} // HM Rage
        }
    }
};

module.exports = function antaroth_guide(dispatch) {

	let hooks = [],
        enabled = true,
        insidemap = false,
        streamenabled = false,
        isTank = false,
        bossInfo = undefined;

    dispatch.hook('S_LOGIN', 10, (event) => {
        let job = (event.templateId - 10101) % 100;
        isTank = (job === 1 || job === 10) ? true : false;
    });

    dispatch.hook('S_LOAD_TOPO', 3, (event) => {
        if (event.zone === mapID[0]) 
        {								
            if (!insidemap) dispatch.command.message('Welcome to Antaroth - Normal Mode');
            insidemap = true;
            load();
        } 
        else if (event.zone === mapID[1]) {
            if (!insidemap) dispatch.command.message('Welcome to Antaroth - Hard Mode');
            insidemap = true;
            load();
        } 
        else
        {
            insidemap = false;
            unload();
        }
    });
	
    dispatch.command.add('aaguide', (arg) => {
        if (arg) arg = arg.toLowerCase();
        if (arg === undefined) {
            //if(!insidemap) { command.message('You must be inside Antaroth'); return; }
            enabled = !enabled;
            dispatch.command.message((enabled ? 'Enabled' : 'Disabled') + '.');
        }
        else if(arg === "off")
        {
            enabled = false;
            dispatch.command.message((enabled ? 'Enabled' : 'Disabled') + '.');
        }
        else if(arg === "on")
        {
            enabled = true;
            dispatch.command.message((enabled ? 'Enabled' : 'Disabled') + '.');
        }
        else if(arg === "stream")
        {
            streamenabled = !streamenabled;
            dispatch.command.message((streamenabled ? 'Stream mode Enabled' : 'Stream mode Disabled'));
        }
        else if(arg === "tank")
        {
            isTank = !isTank;
            dispatch.command.message('Tank Mode '+(isTank ? 'Enabled' : 'Disabled') + '.');
        }
    });
	
	function sendMessage(msg)
	{
		if(streamenabled) 
		{
			dispatch.command.message(msg);
		}
		else 
		{
			dispatch.toClient('S_CHAT', 1, {
			channel: 21, //21 = p-notice, 1 = party
			authorName: 'DG-Guide',
			message: msg
			});
		}
	}
	
    let lasttwoup = 0;
    function load()
    {
        if(!hooks.length)
        {
            hook('S_BOSS_GAGE_INFO', 3, (event) => {
                bossInfo = event;
            });
            
            hook('S_ACTION_STAGE', 7, (event) => {              
                if (!enabled) return;                
                if (!bossInfo) return;
                if (!event.gameId.equals(bossInfo.id)) return;
                if (!BossActions[bossInfo.huntingZoneId] || !BossActions[bossInfo.huntingZoneId][bossInfo.templateId]) return;
                
                let bossAction = BossActions[bossInfo.huntingZoneId][bossInfo.templateId][event.skill.id];
                if (bossAction) 
                {
                    if (bossAction.deletionTimer) 
                    {
                        /*Bug: Deletes start happening at 80%, the first notification will not be sent. To fix, need to check boss HP*/
                        /*Bug: A message gets sent one time after boss dies. To fix, need to clear timer when boss dies or when party wipes.*/
                        setTimeout(()=>{sendMessage(bossAction.msg)}, 60000); // usually happens ~70000
                    }
                    else if (bossAction.checkTwoUp) 
                    {
                        let now = Date.now();
                        if((now - lasttwoup) < 3000) // usually <2350
                        {
                            sendMessage(bossAction.msg);
                        }
                        lasttwoup = now;
                    }
                    else if (isTank && bossAction.msgForTanks) 
                    {
                        sendMessage(bossAction.msgForTanks);
                    }
                    else
                    {
                        sendMessage(bossAction.msg);
                    }
                }
            });
        }
    }
	
	function unload() {
		if(hooks.length) {
			for(let h of hooks) dispatch.unhook(h)

			hooks = []
		}
	}

	function hook() {
		hooks.push(dispatch.hook(...arguments))
	}
    
}
