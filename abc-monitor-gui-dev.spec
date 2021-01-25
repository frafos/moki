Name:		abc-monitor-gui-dev
Version:       4.6.0
Release:	1%{?dist}
Summary:	GUI part of abc-monitor developement pack

Group:		Applications/Internet
License:	Commercial
#URL:
Source:		%{name}-%{version}-%{release}.tar.gz
BuildArch:	x86_64
BuildRoot:	%{_tmppath}/%{name}-%{version}-%{release}-root
Requires:	elasticsearch
Requires:	nodejs >= 8.9.4
BuildRequires:  npm, yarn
Obsoletes:	sbc-events-gui
Requires:	nodejs
Requires:	yarn

%description
ABC Monitor GUI

%prep

%setup -q

%build

%install
#rm -rf %{buildroot}
mkdir -p %{buildroot}/opt/abc-monitor-gui/
mkdir -p %{buildroot}/opt/abc-monitor-gui/www
install html*/.html %{buildroot}/opt/abc-monitor-gui/www/

# install logstash users file
mkdir -p %{buildroot}/var/lib/logstash
install etc/users.json %{buildroot}/var/lib/logstash/users.json
install etc/sns.json %{buildroot}/var/lib/logstash/sns.json

# install moki
install -d %{buildroot}/usr/share/Moki
cp -r Moki/server %{buildroot}/usr/share/Moki/
cp -r Moki/client %{buildroot}/usr/share/Moki/

# install moki def logo
install -d %{buildroot}/usr/share/Moki/styles/
cp -r Moki/client/src/styles/logo.png %{buildroot}/usr/share/Moki/styles/


# install moki service file
install -d %{buildroot}/usr/lib/systemd/system
install -m 0644 etc/moki-server.service %{buildroot}/usr/lib/systemd/system
install -m 0644 etc/moki-client.service %{buildroot}/usr/lib/systemd/system/

# perform moki API install
cd %{buildroot}/usr/share/Moki/server
npm install

# perform moki utils install
# cd %{buildroot}/usr/share/Moki/utils
# npm install

# perform moki utils install
cd %{buildroot}/usr/share/Moki/client
npm install

# fix absolute paths that npm leaves there due to npm feature/bug
find %{buildroot}/usr/share/Moki -name "package.json" -exec sed -i 's#%{buildroot}##' '{}' \;

# dump flag file
mkdir -p %{buildroot}/etc/abc-monitor
touch %{buildroot}/etc/abc-monitor/debug.flag

%clean
rm -rf %{buildroot}

%post
# create node-web user, if not existing already
/usr/bin/getent group node-web >/dev/null || /usr/sbin/groupadd -r node-web
/usr/bin/getent passwd node-web >/dev/null || /usr/sbin/useradd -r -d /opt -s /sbin/nologin -g node-web node-web
/usr/sbin/usermod -a -G logstash node-web
set -o pipefail

# change ownership to allow transformer write
chown node-web /var/lib/logstash/users.json
chown node-web /var/lib/logstash/sns.json

systemctl daemon-reload
echo "Enabling and restarting moki services"
systemctl -q enable moki-server moki-client
systemctl -q restart moki-server moki-client

%files
/opt/abc-monitor-gui/
# empty dir
#%defattr(-,root,root,-)
#%doc
#/opt/abc-monitor-gui/node_modules/
/var/lib/logstash/users.json
/var/lib/logstash/sns.json
/usr/share/Moki/server
/usr/share/Moki/styles
/usr/share/Moki/client
/usr/lib/systemd/system/moki-server.service
/usr/lib/systemd/system/moki-client.service
/etc/abc-monitor/debug.flag

%changelog