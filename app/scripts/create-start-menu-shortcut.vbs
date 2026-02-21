' إنشاء اختصار في قائمة Start لـ Tesla Cafe POS
Set WshShell = CreateObject("WScript.Shell")

' الحصول على مسار قائمة Start
StartMenuPath = WshShell.SpecialFolders("StartMenu")

' مسار المشروع
ProjectPath = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName) & "\.."

' مسار ملف التشغيل
BatchPath = ProjectPath & "\scripts\start-app.bat"

' مسار الأيقونة
IconPath = ProjectPath & "\assets\icon.ico"

' إنشاء مجلد Tesla Cafe POS في قائمة Start
TeslaFolderPath = StartMenuPath & "\Tesla Cafe POS"
If Not CreateObject("Scripting.FileSystemObject").FolderExists(TeslaFolderPath) Then
    CreateObject("Scripting.FileSystemObject").CreateFolder(TeslaFolderPath)
End If

' إنشاء الاختصار
Set Shortcut = WshShell.CreateShortcut(TeslaFolderPath & "\Tesla Cafe POS.lnk")
Shortcut.TargetPath = "cmd.exe"
Shortcut.Arguments = "/k """ & BatchPath & """"
Shortcut.WorkingDirectory = ProjectPath
Shortcut.Description = "Tesla Cafe POS - نظام كاشير الكافيه"
Shortcut.IconLocation = IconPath
Shortcut.Save

WScript.Echo "تم إنشاء الاختصار في قائمة Start بنجاح!"
WScript.Echo "يمكنك الآن العثور على التطبيق في: Start Menu > Tesla Cafe POS"
