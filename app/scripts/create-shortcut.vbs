' إنشاء اختصار على سطح المكتب لـ Tesla Cafe POS
Set WshShell = CreateObject("WScript.Shell")

' الحصول على مسار سطح المكتب
DesktopPath = WshShell.SpecialFolders("Desktop")

' مسار المشروع
ProjectPath = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName) & "\.."

' مسار ملف التشغيل
BatchPath = ProjectPath & "\scripts\start-app.bat"

' مسار الأيقونة
IconPath = ProjectPath & "\assets\icon.ico"

' إنشاء الاختصار
Set Shortcut = WshShell.CreateShortcut(DesktopPath & "\Tesla Cafe POS.lnk")
Shortcut.TargetPath = "cmd.exe"
Shortcut.Arguments = "/k """ & BatchPath & """"
Shortcut.WorkingDirectory = ProjectPath
Shortcut.Description = "Tesla Cafe POS - نظام كاشير الكافيه"
Shortcut.IconLocation = IconPath
Shortcut.Save

WScript.Echo "تم إنشاء الاختصار على سطح المكتب بنجاح!"
WScript.Echo "يمكنك الآن النقر على الاختصار لفتح التطبيق"
