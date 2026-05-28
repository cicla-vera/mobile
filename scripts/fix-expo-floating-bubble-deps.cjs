const fs = require('node:fs');
const path = require('node:path');

const appRoot = process.cwd();
const floatingBubbleRoot = path.join(
  appRoot,
  'node_modules',
  'expo-floating-bubble',
);
const bundledModulesRoot = path.join(floatingBubbleRoot, 'node_modules');

const modulesToRemove = [
  'expo-modules-core',
  'react-native-gesture-handler',
  'react-native-reanimated',
  'react-native-safe-area-context',
];

for (const moduleName of modulesToRemove) {
  const targetPath = path.join(bundledModulesRoot, moduleName);

  if (!fs.existsSync(targetPath)) {
    continue;
  }

  fs.rmSync(targetPath, { recursive: true, force: true });
  console.log(`[postinstall] removed bundled ${moduleName}`);
}

patchFloatingBubbleServiceKt();
patchFloatingBubbleLayoutXml();

function patchFloatingBubbleServiceKt() {
  const servicePath = path.join(
    floatingBubbleRoot,
    'android',
    'src',
    'main',
    'java',
    'expo',
    'modules',
    'floatingbubble',
    'ExpoFloatingBubbleService.kt',
  );

  if (!fs.existsSync(servicePath)) {
    return;
  }

  const PATCH_MARKER = '// CICLAVERA_BUBBLE_PATCH_V6';
  let source = fs.readFileSync(servicePath, 'utf8').replace(/\r\n/g, '\n');

  source = revertPreviousBubblePatches(source);

  if (!source.includes('import android.graphics.Bitmap\n')) {
    source = source.replace(
      'import android.graphics.BitmapFactory',
      'import android.graphics.Bitmap\nimport android.graphics.BitmapFactory',
    );
  }

  if (!source.includes('import android.graphics.drawable.GradientDrawable')) {
    source = source.replace(
      'import android.graphics.BitmapFactory',
      'import android.graphics.BitmapFactory\nimport android.graphics.drawable.GradientDrawable',
    );
  }

  if (!source.includes('import android.app.PendingIntent')) {
    source = source.replace(
      'import android.app.Notification',
      'import android.app.Notification\nimport android.app.PendingIntent',
    );
  }

  const helpers = `
    ${PATCH_MARKER}
    val bubbleTargetPx = (48f * resources.displayMetrics.density).toInt().coerceAtLeast(48)
    val bubbleIconPaddingPx = (bubbleTargetPx * 0.18f).toInt()
    fun scaleBubbleBitmap(bitmap: android.graphics.Bitmap): android.graphics.Bitmap {
      return try {
        val iconPx = (bubbleTargetPx - 2 * bubbleIconPaddingPx).coerceAtLeast(16)
        android.graphics.Bitmap.createScaledBitmap(bitmap, iconPx, iconPx, true)
      } catch (_: Throwable) {
        bitmap
      }
    }
    fun makeCircularBubbleBackground(color: Int): android.graphics.drawable.Drawable {
      return android.graphics.drawable.GradientDrawable().apply {
        shape = android.graphics.drawable.GradientDrawable.OVAL
        setColor(color)
      }
    }
    fun bringHostAppToFront() {
      try {
        val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
        if (launchIntent != null) {
          launchIntent.addFlags(
            android.content.Intent.FLAG_ACTIVITY_NEW_TASK or
              android.content.Intent.FLAG_ACTIVITY_SINGLE_TOP or
              android.content.Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
          )
          startActivity(launchIntent)
        }
      } catch (e: Throwable) {
        android.util.Log.e("FloatingBubble", "bringHostAppToFront failed", e)
      }
    }
`;

  source = source.replace(
    '    // Apply icon and background color',
    `${helpers}\n    // Apply icon and background color`,
  );

  source = source.replace(
    /setImageBitmap\(bitmap\)/g,
    'setImageBitmap(scaleBubbleBitmap(bitmap))',
  );

  source = source.replace(
    'setBackgroundColor(bubbleColor)',
    'background = makeCircularBubbleBackground(bubbleColor)\n        setPadding(bubbleIconPaddingPx, bubbleIconPaddingPx, bubbleIconPaddingPx, bubbleIconPaddingPx)',
  );

  source = source.replace(
    /bubbleView!!\.measure\(\s*MeasureSpec\.UNSPECIFIED,\s*MeasureSpec\.UNSPECIFIED\s*\)/,
    'bubbleView!!.measure(\n      MeasureSpec.makeMeasureSpec(bubbleTargetPx, MeasureSpec.EXACTLY),\n      MeasureSpec.makeMeasureSpec(bubbleTargetPx, MeasureSpec.EXACTLY)\n    )',
  );

  source = source.replace(
    'android.util.Log.d("FloatingBubble", "Bubble tapped! Sending event...")\n            // Send event to React Native instead of bringing app to front\n            sendBubbleTappedEvent()',
    'android.util.Log.d("FloatingBubble", "Bubble tapped! Bringing host app to front and sending event...")\n            bringHostAppToFront()\n            sendBubbleTappedEvent()',
  );

  source = source
    .replace('val channelId = "bubble_channel"', 'val channelId = "cycle_health_insights_foreground"')
    .replace('val channelName = "Floating Bubble"', 'val channelName = "Saude feminina"');

  source = source.replace(
    /(\s*)val notification: Notification =\n\s*NotificationCompat\.Builder\(this, channelId\)\n\s*\.setContentTitle\("Floating Bubble Active"\)\n\s*\.setContentText\("The floating bubble is running\."\)\n\s*\.setSmallIcon\(iconResId\)\n\s*\.build\(\)/,
    `$1val triggerIntent = packageManager.getLaunchIntentForPackage(packageName)?.apply {
$1  action = android.content.Intent.ACTION_VIEW
$1  data = Uri.parse("cicla-vera://security-mode-trigger")
$1  addFlags(
$1    android.content.Intent.FLAG_ACTIVITY_NEW_TASK or
$1      android.content.Intent.FLAG_ACTIVITY_SINGLE_TOP or
$1      android.content.Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
$1  )
$1}
$1val pendingIntentFlags =
$1  PendingIntent.FLAG_UPDATE_CURRENT or
$1    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
$1val triggerPendingIntent = triggerIntent?.let {
$1  PendingIntent.getActivity(this, 6401, it, pendingIntentFlags)
$1}

$1val notificationBuilder = NotificationCompat.Builder(this, channelId)
$1  .setContentTitle("Cicla")
$1  .setContentText("Acompanhamento do ciclo ativo.")
$1  .setSmallIcon(iconResId)
$1  .setOngoing(true)
$1  .setSilent(true)

$1triggerPendingIntent?.let {
$1  notificationBuilder.setContentIntent(it)
$1  notificationBuilder.addAction(iconResId, "Simular gatilho", it)
$1}

$1val notification: Notification = notificationBuilder.build()`,
  );

  fs.writeFileSync(servicePath, source);
  console.log(
    '[postinstall] patched ExpoFloatingBubbleService.kt (V6: circular + 48dp + padding + activity/notification trigger)',
  );
}

function revertPreviousBubblePatches(source) {
  let next = source;

  next = next.replace(/setImageBitmap\(scaleBubbleBitmap\(bitmap\)\)/g, 'setImageBitmap(bitmap)');

  next = next.replace(
    /bubbleView!!\.measure\(\s*MeasureSpec\.makeMeasureSpec\(bubbleTargetPx, MeasureSpec\.EXACTLY\),\s*MeasureSpec\.makeMeasureSpec\(bubbleTargetPx, MeasureSpec\.EXACTLY\)\s*\)/,
    'bubbleView!!.measure(\n      MeasureSpec.UNSPECIFIED,\n      MeasureSpec.UNSPECIFIED\n    )',
  );

  next = next.replace(
    /background = makeCircularBubbleBackground\(bubbleColor\)\s*\n\s*setPadding\(bubbleIconPaddingPx, bubbleIconPaddingPx, bubbleIconPaddingPx, bubbleIconPaddingPx\)/,
    'setBackgroundColor(bubbleColor)',
  );

  next = next.replace(
    /android\.util\.Log\.d\("FloatingBubble", "Bubble tapped! Bringing host app to front and sending event\.\.\."\)\s*\n\s*bringHostAppToFront\(\)\s*\n\s*sendBubbleTappedEvent\(\)/,
    'android.util.Log.d("FloatingBubble", "Bubble tapped! Sending event...")\n            // Send event to React Native instead of bringing app to front\n            sendBubbleTappedEvent()',
  );

  next = next.replace(
    /\n\s*\/\/ CICLAVERA_BUBBLE.*PATCH_V\d+[\s\S]*?(?=\n\s*\/\/ Apply icon)/,
    '\n',
  );

  return next;
}

function patchFloatingBubbleLayoutXml() {
  const layoutPath = path.join(
    floatingBubbleRoot,
    'android',
    'src',
    'main',
    'res',
    'layout',
    'bubble_layout.xml',
  );

  if (!fs.existsSync(layoutPath)) {
    return;
  }

  const xml = fs.readFileSync(layoutPath, 'utf8');

  if (!xml.includes('@android:color/holo_blue_light')) {
    return;
  }

  const patched = xml.replace(
    /android:background="@android:color\/holo_blue_light"\s*/,
    '',
  );

  fs.writeFileSync(layoutPath, patched);
  console.log('[postinstall] patched bubble_layout.xml (removed default holo background)');
}
