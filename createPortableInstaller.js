const EI = require('electron-winstaller');

try{
	EI.createWindowsInstaller({
		appDirectory: './tetrisapp-win32-x64',
		outputDirectory: 'tetrisapp-installer',
		authors: 'Unknown',
		exe: 'tetrisapp.exe'
	}).then(e=>{
		console.log('Success');
	}).catch(e=>{
		console.error(e.message);
	})
} catch(e) {
	console.error(e.message);
}