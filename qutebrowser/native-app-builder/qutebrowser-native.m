#import <Foundation/Foundation.h>
#import <AppKit/AppKit.h>
#include <Python.h>

int main(int argc, const char * argv[]) {
    @autoreleasepool {
        // Set application name for menu bar
        [NSApplication sharedApplication];
        [[NSProcessInfo processInfo] setProcessName:@"qutebrowser"];
        
        // Set environment variables
        setenv("PATH", "/opt/homebrew/bin:/usr/local/bin", 1);
        setenv("QT_PLUGIN_PATH", "/opt/homebrew/share/qt/plugins", 1);
        setenv("QTWEBENGINE_RESOURCES_PATH", "/opt/homebrew/lib/QtWebEngineCore.framework/Resources", 1);
        
        // Qt flags for better macOS integration
        setenv("QT_MAC_WANTS_LAYER", "1", 1);
        setenv("QT_AUTO_SCREEN_SCALE_FACTOR", "1", 1);
        setenv("QT_ENABLE_HIGHDPI_SCALING", "1", 1);
        setenv("QT_MAC_USE_COCOA", "1", 1);
        setenv("QT_LOGGING_RULES", "qt.qpa.cocoa.debug=false", 1);
        
        // Force Qt to use native window management
        setenv("QT_QPA_PLATFORM", "cocoa", 1);
        setenv("QT_MAC_DISABLE_FOREGROUND_APPLICATION_TRANSFORM", "0", 1);
        
        // Initialize Python interpreter
        Py_SetProgramName(L"qutebrowser");
        Py_Initialize();
        
        if (!Py_IsInitialized()) {
            NSLog(@"Failed to initialize Python interpreter");
            return 1;
        }
        
        // Convert arguments to Python format
        wchar_t **python_argv = malloc(argc * sizeof(wchar_t*));
        for (int i = 0; i < argc; i++) {
            size_t len = strlen(argv[i]) + 1;
            python_argv[i] = malloc(len * sizeof(wchar_t));
            mbstowcs(python_argv[i], argv[i], len);
        }
        
        // Set Python sys.argv
        PySys_SetArgv(argc, python_argv);
        
        // Import qutebrowser module and call main
        PyObject* qutebrowser_module = PyImport_ImportModule("qutebrowser.qutebrowser");
        if (!qutebrowser_module) {
            PyErr_Print();
            Py_Finalize();
            return 1;
        }
        
        PyObject* main_func = PyObject_GetAttrString(qutebrowser_module, "main");
        if (!main_func || !PyCallable_Check(main_func)) {
            NSLog(@"Cannot find qutebrowser.main function");
            Py_DECREF(qutebrowser_module);
            Py_Finalize();
            return 1;
        }
        
        // Call main()
        PyObject* result = PyObject_CallObject(main_func, NULL);
        int exit_code = 0;
        
        if (result == NULL) {
            PyErr_Print();
            exit_code = 1;
        } else {
            Py_DECREF(result);
        }
        
        // Cleanup
        Py_DECREF(main_func);
        Py_DECREF(qutebrowser_module);
        
        // Free memory
        for (int i = 0; i < argc; i++) {
            free(python_argv[i]);
        }
        free(python_argv);
        
        Py_Finalize();
        return exit_code;
    }
}