// nilguard — keeps Raycast's Macked crack loaded but stops it from killing the app.
//
// The crack (macked.app.dylib) calls +[NSJSONSerialization dataWithJSONObject:options:error:]
// with a nil object when one of its HTTP requests comes back unexpected (observed with 403
// responses). That raises NSInvalidArgumentException -> uncaught exception -> the whole app
// terminates in a loop.
//
// This shim takes the crack's place in Contents/Frameworks, swizzles that one class method to
// substitute an empty dictionary for nil, then dlopen()s the real crack from macked-orig.dylib
// so every other crack behaviour (Nord theme, Pro unlocks, ...) keeps working.
//
// Install/restore: raycast/fix-macked-crash.sh

#import <Foundation/Foundation.h>
#import <objc/runtime.h>
#import <dlfcn.h>

#define MACKED_ORIG "/Applications/Raycast.app/Contents/Frameworks/macked-orig.dylib"

@interface NSJSONSerialization (NilGuard)
+ (NSData *)ng_dataWithJSONObject:(id)obj options:(NSJSONWritingOptions)opt error:(NSError **)error;
@end

@implementation NSJSONSerialization (NilGuard)

+ (NSData *)ng_dataWithJSONObject:(id)obj options:(NSJSONWritingOptions)opt error:(NSError **)error {
	if (obj == nil) {
		NSLog(@"[nilguard] nil JSON object -> substituting {}");
		obj = @{};
	}
	// After the exchange below, this selector is the original implementation.
	return [self ng_dataWithJSONObject:obj options:opt error:error];
}

@end

__attribute__((constructor)) static void ng_init(void) {
	Method orig = class_getClassMethod([NSJSONSerialization class], @selector(dataWithJSONObject:options:error:));
	Method mine = class_getClassMethod([NSJSONSerialization class], @selector(ng_dataWithJSONObject:options:error:));
	if (orig && mine) {
		method_exchangeImplementations(orig, mine);
	}

	void *handle = dlopen(MACKED_ORIG, RTLD_NOW | RTLD_GLOBAL);
	const char *err = handle ? NULL : dlerror();
	NSLog(@"[nilguard] armed (swizzle=%s, macked=%s%s%s)", (orig && mine) ? "ok" : "FAILED", handle ? "ok" : "FAILED",
	      err ? ": " : "", err ? err : "");
}
