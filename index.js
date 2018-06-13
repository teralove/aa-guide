/* Usable Sysbols ◎●←↑→↓↖↗↘↙ */

const Command = require('command');
const mapID = [9720, 9920];					// MAP ID to input [ Normal Mode , Hard Mode ]

// BossAction[HuntingZoneId][TempalateId][Skill]
const BossActions = {
    // Normal Mode
    720: {
        // First Boss
        1000: {
            1188037724: {msg: 'Out ↓ In ↑'},
            1188038724: {msg: 'Out ↓ In ↑'}, // rage
            1188037725: {msg: 'In ↑ Out ↓'},
            1188038725: {msg: 'In ↑ Out ↓'}, // rage
            1188037908: {msg: 'Delete soon', deletionTimer: true}, // 'Your flesh will be deleted!'
        },
        // Second Boss NM
        2000: {
            // Second Boss NM
            1188037714: {msg: 'Spin ↓'},
            1188038714: {msg: 'Spin ↓'}, // rage
            1188039727: {msg: 'Red, Out safe ↓'},
            1188039828: {msg: 'Blue, In safe ↑'},   
        },
        // Third Boss NM
        3000: {
            // Third Boss NM
            1188037721: {msg: 'Front, Back stun ↓'},
            1188038721: {msg: 'Front, Back stun ↓'}, // rage
            1188037719: {msg: '→ Right Safe →', msgForTanks: '← Left Safe ←'},
            1188038719: {msg: '→ Right Safe →', msgForTanks: '← Left Safe ←'}, // rage
            1188037717: {msg: '← Left Safe ←',  msgForTanks: '→ Right Safe →'},
            1188038717: {msg: '← Left Safe ←',  msgForTanks: '→ Right Safe →'}, // rage
            1188037712: {msg: 'Back stun ↓', checkTwoUp: true},
            1188038712: {msg: 'Back stun ↓', checkTwoUp: true}, // rage            
        }
    },
    // Hard Mode
    920: {
        // First Boss HM
        1000: {
            1201144938: {msg: 'In ↑ Out ↓'}, // (big aoe)
            1201145938: {msg: 'Out ↓ In ↑'}, // (big aoe) rage
            1201144924: {msg: 'Out ↓ In ↑'},
            1201145924: {msg: 'Out ↓ In ↑'}, // rage
            1201144925: {msg: 'In ↑ Out ↓'},
            1201145925: {msg: 'In ↑ Out ↓'}, // rage
            1201145108: {msg: 'Delete soon', deletionTimer: true},
        },
        // Second Boss HM
        2000: {
            1201144914: {msg: 'Spin ↓'},
            1201145914: {msg: 'Spin ↓'}, // rage
            1201146927: {msg: 'Red, Out safe ↓'},
            1201147028: {msg: 'Blue, In safe ↑'},    
        },
        // Third Boss HM
        3000: {
            1201144921: {msg: 'Front, back stun ↓'},
            1201145921: {msg: 'Front, back stun ↓'}, // rage
            1201144919: {msg: '→ Right Safe, OUT safe', msgForTanks: '← Left Safe, OUT safe'},
            1201145919: {msg: '→ Right Safe, OUT safe', msgForTanks: '← Left Safe, OUT safe'}, // rage
            1201144917: {msg: '← Left Safe, IN safe',   msgForTanks: '→ Right Safe, IN safe'},
            1201145917: {msg: '← Left Safe, IN safe',   msgForTanks: '→ Right Safe, IN safe'}, // rage
            1201144912: {msg: 'Back stun ↓', checkTwoUp: true}, // HM
            1201145912: {msg: 'Back stun ↓', checkTwoUp: true} // HM Rage
        }
    }
};
/*const ToTest = {						// Third Boss Attack Actions
	1188037809: {msg: 'Red Aura ↓'},
	1188038716: {msg: 'Red Thrust ↓'},
	1201145009: {msg: 'Red Aura ↓'}, // HM
	1201144916: {msg: 'Red Thrust ↓'} // HM
};*/

module.exports = function antaroth_guide(dispatch) {
	const command = Command(dispatch);
	let hooks = [],
        sendToParty = false,
        enabled = true,
        insidemap = false,
        streamenabled = false,
        isTank = false,
        bossInfo = undefined;

    dispatch.hook('S_LOGIN', 10, (event) => {
        let job = (event.templateId - 10101) % 100;
        isTank = (job === 1 || job === 10) ? true : false;
    });
    
    dispatch.hook('C_MEET_BOSS_INFO', 1, (event) => {
        bossInfo = event;
    });
    
    dispatch.hook('S_LOAD_TOPO', 1, (event) => {
        if (event.zone === mapID[0]) 
        {								
            if (!insidemap) command.message('Welcome to Antaroth - Normal Mode');
            insidemap = true;
            load();
        } 
        else if (event.zone === mapID[1]) {
            if (!insidemap) command.message('Welcome to Antaroth - Hard Mode');
            insidemap = true;
            load();
        } 
        else
        {
            insidemap = false;
            unload();
        }
    });
	
    command.add('aaguide', (arg) => {
        if (arg === undefined) {
            //if(!insidemap) { command.message('You must be inside Antaroth'); return; }
            enabled = !enabled;
            command.message('Antaroth Guide '+(enabled ? 'Enabled' : 'Disabled') + '.');
        }
        else if(arg.toLowerCase() === "off")
        {
            enabled = false;
            command.message('Antaroth Guide '+(enabled ? 'Enabled' : 'Disabled') + '.');
        }
        else if(arg.toLowerCase() === "on")
        {
            enabled = true;
            command.message('Antaroth Guide '+(enabled ? 'Enabled' : 'Disabled') + '.');
        }
        else if(arg.toLowerCase() === "stream")
        {
            streamenabled = !streamenabled;
            sendToParty = false;
            command.message((streamenabled ? 'Stream mode Enabled' : 'Stream mode Disabled'));
        }
        else if(arg.toLowerCase() === "toparty")
        {
            streamenabled = false;
            sendToParty = !sendToParty;
            command.message((sendToParty ? 'Antaroth Guide - Messages will be sent to the party' : 'Antaroth Guide - Only you will see messages in chat'));
        }
        else if(arg.toLowerCase() === "tank")
        {
            isTank = !isTank;
            command.message('Antaroth Guide - Tank Mmde '+(isTank ? 'Enabled' : 'Disabled') + '.');
        }
    });
	
	function sendMessage(msg)
	{
		if (sendToParty) 
		{
			dispatch.toServer('C_CHAT', 1, {
			channel: 21, //21 = p-notice, 1 = party, 2 = guild
			message: msg
			});
		}
		else if(streamenabled) 
		{
			command.message(msg);
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
            hook('S_ACTION_STAGE', 5, (event) => {              
                if (!enabled) return;                
                if (!bossInfo) return;
                if (!BossActions[bossInfo.huntingZoneId] || !BossActions[bossInfo.huntingZoneId][bossInfo.templateId]) return;
                /*Optimization Todo: Skip players, only continue if boss is performing action*/
                
                let bossAction = BossActions[bossInfo.huntingZoneId][bossInfo.templateId][event.skill];
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
                            sendMessage(bossAction.msg /* + " : " + String(now - lasttwoup)*/ );
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
				/*else if (ToTest[event.skill])
				{
					sendMessage(ToTest[event.skill].msg);
					var today = new Date();
					var h = today.getHours();
					var m = today.getMinutes();
					var s = today.getSeconds();
					command.message(h + ":" + m + ":" + s + " - " + String(event.skill));
					console.log(h + ":" + m + ":" + s + " - " + JSON.stringify(event, null, 4));
					console.log(ToTest[event.skill].msg);
				}*/
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
