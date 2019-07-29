# ArTank

## Setup

`yarn`を実行して下さい。
また `mosquitto` をインストールして下さい。
macの場合は `brew install mosquitto` でインストールできます。 

またChromeのShape Detection APIを利用すため、 Chromeで `chrome://flags/#enable-experimental-web-platform-features`を開き `Experimental Web Platform features` をEnableにしてChromeを再起動して下さい。

## Development server

`ng serre`で開発サーバが立ち上がります。 起動後 http://localhost:4300 にアクセスして下さい。
また mosquitto が立ち上がっていないとアプリケーションが実行できません。

macの場合は
`/path/to/bin/mosquitto -c ./mosquitto.conf` で mosquitto を起動してください。

アプリケーションは基本的にブラウザタブを2つ利用します。
1つは `http://localhost:4300` を もう一つのタブは `http://localhost:4300/?myName=nobunaga&enemyName=dalailama&videoIndex=1` あたりをURLにしてください。

### パラメータの意味

`myName`: 自分のロボット名 デフォルト `dalailama`  
`enemyName`: 敵のロボット名 デフォルト `nobunaga`  
`videoIndex`: 利用するwebcamのvideocamIndex  
 
 
### 設定

アプリケーションは通常はraspberrypiに接続しに行ってしまうので、テストを行う場合はwebcamを利用するか動画ファイルを利用する必要があります。  
設定を変更するには、画面が表示すると表示される右上に設定アイコンをクリックし設定ダイアログを表示します。  
ダイアログ一番下にあるAR設定をwebcamにするとwebcameraから動画ファイルにすると動画ファイルを入力ソースにできます。  
 
## Code scaffolding

新しいコンポーネントは `ng generate component component-name` で作って下さい。

## Build

`ng build` でビルドできます。 production buildは `--prod`をつけて下さい。


