' تثبيت Tesla Cafe POS في شريط المهام
Set WshShell = CreateObject("WScript.Shell")

' مسار المشروع
ProjectPath = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName) & "\.."

' مسار ملف التشغيل
BatchPath = ProjectPath & "\scripts\start-app.bat"

' مسار الأيقونة
IconPath = ProjectPath & "\assets\icon.ico"

' إنشاء اختصار مؤقت
TempShortcutPath = WshShell.SpecialFolders("Desktop") & "\Tesla Cafe POS Temp.lnk"
Set Shortcut = WshShell.CreateShortcut(TempShortcutPath)
Shortcut.TargetPath = "cmd.exe"
Shortcut.Arguments = "/k """ & BatchPath & """"
Shortcut.WorkingDirectory = ProjectPath
Shortcut.Description = "Tesla Cafe POS - نظام كاشير الكافيه"
Shortcut.IconLocation = IconPath
Shortcut.Save

' محاولة تثبيت التطبيق في شريط المهام
WScript.Echo "جاري تثبيت Tesla Cafe POS في شريط المهام..."
WScript.Echo ""
WScript.Echo "تعليمات:"
WScript.Echo "1. انقر بزر الماوس الأيمن على الاختصار المؤقت على سطح المكتب"
WScript.Echo "2. اختر 'تثبيت في شريط المهام'"
WScript.Echo "3. احذف الاختصار المؤقت من سطح المكتب"
WScript.Echo ""

' فتح مجلد سطح المكتب
WshShell.Run "explorer.exe " & WshShell.SpecialFolders("Desktop")

WScript.Echo "تم إنشاء الاختصار المؤقت على سطح المكتب"
WScript.Echo "اتبع التعليمات أعلاه لتثبيت التطبيق في شريط المهام"
