import { ArrowRight, Bell, Flower2, HandHeart, Quote, Sparkles, Waves } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-orb orb-one" />
        <div className="hero-orb orb-two" />
        <div className="hero-copy reveal">
          <p className="eyebrow">
            <span /> Chốn bình yên trong bạn
          </p>
          <h1>
            Một phút dừng chân.
            <br />
            <em>Một đời an nhiên.</em>
          </h1>
          <p className="lead">
            Giữa những vội vàng, hãy dành cho mình một khoảng lặng. Thắp nén tâm hương, lắng nghe tiếng mõ và trở về với
            hơi thở.
          </p>
          <div className="hero-cta">
            <Link className="button primary" to="/chua/an-nhien">
              <Flower2 /> Vào chùa thắp hương <ArrowRight />
            </Link>
            <Link className="text-link" to="/thien">
              Thiền 5 phút <span>→</span>
            </Link>
          </div>
          <div className="today-note">
            <span className="sun-symbol">☼</span>
            <div>
              <small>Gợi ý hôm nay</small>
              <p>“Chỉ cần tâm tĩnh, nơi đâu cũng là thiền.”</p>
            </div>
          </div>
        </div>
        <div className="temple-art" aria-label="Minh họa cổng chùa An Nhiên">
          <div className="moon" />
          <div className="mountain m1" />
          <div className="mountain m2" />
          <div className="pagoda">
            <i className="roof r1" />
            <i className="roof r2" />
            <i className="roof r3" />
            <i className="tower" />
            <i className="door" />
          </div>
          <div className="water">
            <span />
            <span />
            <span />
          </div>
          <div className="lantern l1">●</div>
          <div className="lantern l2">●</div>
        </div>
        <div className="scroll-cue">
          <span />
          Cuộn để khám phá
        </div>
      </section>
      <section className="intro section-pad">
        <p className="eyebrow centered">
          <span /> Nghi thức an lành <span />
        </p>
        <h2>
          Mỗi thao tác, một phút <em>chánh niệm</em>
        </h2>
        <p className="section-lead">Không cần vội, không cần cầu kỳ. Chọn một điều nhỏ để tâm mình dịu lại.</p>
        <div className="ritual-grid">
          <Link to="/chua/an-nhien" className="ritual-card">
            <span className="card-number">01</span>
            <div className="ritual-icon incense-icon">♨</div>
            <h3>Thắp tâm hương</h3>
            <p>Gửi một niệm lành theo làn khói mỏng, để lòng nhẹ đi đôi chút.</p>
            <b>
              Bắt đầu nghi thức <ArrowRight />
            </b>
          </Link>
          <Link to="/chua/an-nhien#moki" className="ritual-card featured">
            <span className="card-number">02</span>
            <div className="ritual-icon">
              <Bell />
            </div>
            <h3>Gõ mõ tĩnh tâm</h3>
            <p>Mỗi tiếng mõ là một nhịp trở về, buông xuống những lao xao.</p>
            <b>
              Lắng nghe tiếng mõ <ArrowRight />
            </b>
          </Link>
          <Link to="/xin-xam" className="ritual-card">
            <span className="card-number">03</span>
            <div className="ritual-icon">
              <Sparkles />
            </div>
            <h3>Xin một lời lành</h3>
            <p>Nhận một thông điệp dịu dàng để soi sáng điều bạn đang băn khoăn.</p>
            <b>
              Xin quẻ hôm nay <ArrowRight />
            </b>
          </Link>
        </div>
      </section>
      <section className="daily-section section-pad">
        <div className="enso">
          <span>心</span>
        </div>
        <div>
          <Quote />
          <blockquote>
            Thở vào, tâm tĩnh lặng.
            <br />
            Thở ra, miệng mỉm cười.
          </blockquote>
          <p>— Thích Nhất Hạnh</p>
          <Link className="button soft" to="/thien">
            <Waves /> Cùng ngồi yên một lát
          </Link>
        </div>
      </section>
      <section className="community-section section-pad">
        <div>
          <p className="eyebrow">
            <span /> Gửi một niệm lành
          </p>
          <h2>
            Điều ước được nâng niu,
            <br />
            <em>lòng người thêm gần lại.</em>
          </h2>
          <p>Đọc những lời nguyện chân thành, gửi một lời “Nam mô” để cùng nhau gieo duyên lành.</p>
          <Link className="button outline" to="/to-nguyen">
            <HandHeart /> Ghé tường điều ước <ArrowRight />
          </Link>
        </div>
        <div className="wish-preview">
          <i>“</i>
          <p>Mong gia đình luôn khỏe mạnh, những người con thương được bình an qua mọi ngày.</p>
          <span>— Một người hữu duyên</span>
          <div>Nam mô · 18</div>
        </div>
      </section>
      <section className="final-cta">
        <Flower2 />
        <p>Mọi an yên đều bắt đầu từ một hơi thở.</p>
        <Link to="/chua/an-nhien">
          Bước vào chùa <ArrowRight />
        </Link>
      </section>
    </>
  )
}
