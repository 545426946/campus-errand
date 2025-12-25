Set oShell = CreateObject("WScript.Shell") 
oShell.CurrentDirectory = "C:\Users\Administrator\Desktop\campus-errand\errand-back"
oShell.Run "cmd /k node simple-server.js", 1, True